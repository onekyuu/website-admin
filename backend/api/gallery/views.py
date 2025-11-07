from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from api.gallery.models import Gallery
from api.gallery.serializers import GallerySerializer, GalleryCreateSerializer
from api.gallery.utils import extract_exif_data, create_thumbnail
from api.core.permissions import IsAdminOrReadOnly
from api.core.pagination import CustomPageNumberPagination
from api.oss.utils import upload_file_to_oss, delete_file_from_oss


class GalleryListView(generics.ListAPIView):
    serializer_class = GallerySerializer
    permission_classes = [AllowAny]
    pagination_class = CustomPageNumberPagination

    def get_queryset(self):
        queryset = Gallery.objects.filter(is_published=True)

        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)

        featured = self.request.query_params.get('featured')
        if featured == 'true':
            queryset = queryset.filter(is_featured=True)

        return queryset


class GalleryCreateView(generics.CreateAPIView):
    serializer_class = GalleryCreateSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        image_file = serializer.validated_data['file']

        try:
            exif_data = extract_exif_data(image_file)

            image_file.seek(0)
            original_result = upload_file_to_oss(
                image_file, directory='uploads/gallery/original')
            image_url = original_result['url']

            thumbnail_url = image_url
            image_file.seek(0)
            thumbnail = create_thumbnail(image_file)
            if thumbnail:
                thumbnail_result = upload_file_to_oss(
                    thumbnail, directory='uploads/gallery/thumbnails')
                thumbnail_url = thumbnail_result['url']

            gallery = Gallery.objects.create(
                title=serializer.validated_data.get('title', ''),
                description=serializer.validated_data.get('description', ''),
                category=serializer.validated_data.get('category', ''),
                tags=serializer.validated_data.get('tags', []),
                is_featured=serializer.validated_data.get(
                    'is_featured', False),
                image_url=image_url,
                thumbnail_url=thumbnail_url,
                uploaded_by=request.user,
                taken_at=exif_data.get('taken_at'),
                camera_make=exif_data.get('camera_make', ''),
                camera_model=exif_data.get('camera_model', ''),
                lens_model=exif_data.get('lens_model', ''),
                shooting_params=exif_data.get('shooting_params', {}),
                photo_properties=exif_data.get('photo_properties', {}),
                location_info=exif_data.get('location_info', {}),
            )

            response_serializer = GallerySerializer(gallery)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': 'Upload failed', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GalleryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = GallerySerializer
    queryset = Gallery.objects.all()
    lookup_field = 'id'

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated(), IsAdminOrReadOnly()]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.view_count += 1
        instance.save(update_fields=['view_count'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            image_object_key = instance.image_url.split('.aliyuncs.com/')[-1]
            delete_file_from_oss(image_object_key)

            if instance.thumbnail_url != instance.image_url:
                thumb_object_key = instance.thumbnail_url.split(
                    '.aliyuncs.com/')[-1]
                delete_file_from_oss(thumb_object_key)
        except Exception as e:
            print(f"Failed to delete OSS files: {e}")

        instance.delete()
        return Response(
            {"message": "Photo deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
        )
