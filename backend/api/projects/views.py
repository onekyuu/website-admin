from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from api.projects.serializers import ProjectSerializer
from api.projects.models import Project
from api.core.permissions import IsAdminOrReadOnly


class ProjectListApiView(generics.ListAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Project.objects.all()


class ProjectCreateApiView(generics.CreateAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]

    def create(self, request, *args, **kwargs):
        translations_data = request.data.pop('translations', [])

        serializer = self.get_serializer(
            data=request.data,
            context={'translations': translations_data}
        )
        serializer.is_valid(raise_exception=True)

        serializer.save(created_by=request.user)

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ProjectDetailAPIView(generics.RetrieveAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [AllowAny]
    lookup_field = 'id'
    lookup_url_kwarg = 'project_id'

    def get_queryset(self):
        return Project.objects.all()

    def update(self, request, *args, **kwargs):
        translations_data = request.data.pop('translations', None)
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=partial,
            context={'translations': translations_data}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)


class ProjectDeleteAPIView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    lookup_field = 'project_id'

    def get_object(self):
        project_id = self.kwargs.get('project_id')
        queryset = self.get_queryset()
        obj = get_object_or_404(queryset, id=project_id)
        self.check_object_permissions(self.request, obj)
        return obj

    def delete(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(
            {"message": "Project deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
        )
