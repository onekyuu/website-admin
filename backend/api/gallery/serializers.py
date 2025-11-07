from rest_framework import serializers
from api.gallery.models import Gallery


class GallerySerializer(serializers.ModelSerializer):
    exif_summary = serializers.SerializerMethodField()
    uploaded_by_username = serializers.CharField(
        source='uploaded_by.username', read_only=True)

    class Meta:
        model = Gallery
        fields = [
            'id', 'title', 'description', 'image_url', 'thumbnail_url',
            'taken_at', 'camera_make', 'camera_model', 'lens_model',
            'shooting_params', 'photo_properties', 'location_info',
            'category', 'tags',
            'is_featured', 'is_published', 'view_count',
            'uploaded_by', 'uploaded_by_username', 'exif_summary',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['uploaded_by',
                            'view_count', 'created_at', 'updated_at']

    def get_exif_summary(self, obj):
        return obj.get_exif_summary()


class GalleryCreateSerializer(serializers.Serializer):
    file = serializers.ImageField()
    title = serializers.CharField(
        max_length=200, required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    category = serializers.CharField(
        max_length=50, required=False, allow_blank=True)
    tags = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        allow_empty=True
    )
    is_featured = serializers.BooleanField(default=False)
