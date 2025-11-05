from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from api.projects.serializers import ProjectSerializer, ProjectSkillSerializer
from api.projects.models import Project, ProjectSkill, ProjectTranslation
from api.core.permissions import IsAdminOrReadOnly
from api.core.translation import translate_text


class ProjectListApiView(generics.ListAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Project.objects.all()


class ProjectCreateApiView(generics.CreateAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]

    def create(self, request, *args, **kwargs):
        translations_data = request.data.pop('translations', {})
        skill_ids = request.data.get('skill_ids', [])

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = serializer.save(created_by=request.user)

        supported_languages = ['zh', 'en', 'ja']

        source_lang = None
        source_translation = None
        for lang in supported_languages:
            if lang in translations_data and translations_data[lang].get('title'):
                source_lang = lang
                source_translation = translations_data[lang]
                break

        if not source_lang:
            return Response(
                {"error": "At least one translation must be provided"},
                status=status.HTTP_400_BAD_REQUEST
            )

        for target_lang in supported_languages:
            if target_lang in translations_data and translations_data[target_lang].get('title'):
                ProjectTranslation.objects.create(
                    project=project,
                    language=target_lang,
                    title=translations_data[target_lang].get('title', ''),
                    description=translations_data[target_lang].get(
                        'description', ''),
                )
            else:
                translated_title = translate_text(
                    source_translation.get('title', ''),
                    source_lang,
                    target_lang
                )

                translated_description = ''
                if source_translation.get('description'):
                    translated_description = translate_text(
                        source_translation['description'],
                        source_lang,
                        target_lang
                    )

                ProjectTranslation.objects.create(
                    project=project,
                    language=target_lang,
                    title=translated_title,
                    description=translated_description,
                )

        response_serializer = self.get_serializer(project)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class ProjectDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [AllowAny]
    queryset = Project.objects.prefetch_related('skills', 'translations')
    lookup_field = 'slug'  # 改为 slug
    lookup_url_kwarg = 'project_slug'  # 改为 project_slug

    def get_permissions(self):
        """GET 请求允许所有人访问，其他操作需要认证"""
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated(), IsAdminOrReadOnly()]

    def update(self, request, *args, **kwargs):
        translations_data = request.data.pop('translations', {})
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=partial
        )
        serializer.is_valid(raise_exception=True)
        project = serializer.save()

        supported_languages = ['zh', 'en', 'ja']

        source_lang = None
        source_translation = None
        for lang in supported_languages:
            if lang in translations_data and translations_data[lang].get('title'):
                source_lang = lang
                source_translation = translations_data[lang]
                break

        if not source_lang:
            existing_translation = project.translations.filter(
                language='zh'
            ).first() or project.translations.first()

            if existing_translation:
                source_lang = existing_translation.language
                source_translation = {
                    'title': existing_translation.title,
                    'description': existing_translation.description,
                }

        if source_lang and source_translation:
            for target_lang in supported_languages:
                if target_lang in translations_data and translations_data[target_lang].get('title'):
                    ProjectTranslation.objects.update_or_create(
                        project=project,
                        language=target_lang,
                        defaults={
                            'title': translations_data[target_lang].get('title', ''),
                            'description': translations_data[target_lang].get('description', ''),
                        }
                    )
                else:
                    existing = project.translations.filter(
                        language=target_lang).first()
                    if not existing:
                        translated_title = translate_text(
                            source_translation.get('title', ''),
                            source_lang,
                            target_lang
                        )

                        translated_description = ''
                        if source_translation.get('description'):
                            translated_description = translate_text(
                                source_translation['description'],
                                source_lang,
                                target_lang
                            )

                        ProjectTranslation.objects.update_or_create(
                            project=project,
                            language=target_lang,
                            defaults={
                                'title': translated_title,
                                'description': translated_description,
                            }
                        )

        response_serializer = self.get_serializer(project)
        return Response(response_serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(
            {"message": "Project deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
        )


class ProjectSkillCreateApiView(generics.CreateAPIView):
    serializer_class = ProjectSkillSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ProjectSkillListApiView(generics.ListAPIView):
    serializer_class = ProjectSkillSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return ProjectSkill.objects.all()


class ProjectSkillDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProjectSkillSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    queryset = ProjectSkill.objects.all()
    lookup_field = 'id'
    lookup_url_kwarg = 'skill_id'
