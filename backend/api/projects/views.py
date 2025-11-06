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

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = serializer.save(created_by=request.user)

        # 按优先级查找源语言：中文 > 日语 > 英语
        supported_languages = ['zh', 'ja', 'en']

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

        # 创建所有语言的翻译
        all_languages = ['zh', 'en', 'ja']
        for target_lang in all_languages:
            if target_lang == source_lang:
                # 源语言直接保存
                ProjectTranslation.objects.create(
                    project=project,
                    language=target_lang,
                    title=source_translation.get('title', ''),
                    description=source_translation.get('description', ''),
                    info=source_translation.get('info', []),
                )
            else:
                # 其他语言自动翻译
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

                translated_info = []
                source_info = source_translation.get('info', [])
                for info_item in source_info:
                    if info_item:
                        translated_item = translate_text(
                            info_item,
                            source_lang,
                            target_lang
                        )
                        translated_info.append(translated_item)

                ProjectTranslation.objects.create(
                    project=project,
                    language=target_lang,
                    title=translated_title,
                    description=translated_description,
                    info=translated_info
                )

        response_serializer = self.get_serializer(project)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class ProjectDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [AllowAny]
    queryset = Project.objects.prefetch_related('skills', 'translations')
    lookup_field = 'slug'
    lookup_url_kwarg = 'project_slug'

    def get_permissions(self):
        """GET 请求允许所有人访问，其他操作需要认证"""
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated(), IsAdminOrReadOnly()]

    def _has_translation_updates(self, translations_data, project):
        """检查是否有翻译内容的更新（title、description、info）"""
        if not translations_data:
            return False

        # 按优先级查找源语言：中文 > 日语 > 英语
        supported_languages = ['zh', 'ja', 'en']

        for lang in supported_languages:
            if lang not in translations_data:
                continue

            translation_data = translations_data[lang]
            if not translation_data.get('title'):
                continue

            # 获取现有翻译
            existing = project.translations.filter(language=lang).first()
            if not existing:
                return True

            # 检查是否有内容变化
            if (translation_data.get('title', '') != existing.title or
                translation_data.get('description', '') != existing.description or
                    translation_data.get('info', []) != existing.info):
                return True

        return False

    def update(self, request, *args, **kwargs):
        translations_data = request.data.pop('translations', {})
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        # 更新项目基本信息（images, skill_ids, is_featured 等）
        serializer = self.get_serializer(
            instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        project = serializer.save()

        # 检查是否有翻译内容的更新
        if not self._has_translation_updates(translations_data, project):
            # 没有翻译更新，直接返回
            response_serializer = self.get_serializer(project)
            return Response(response_serializer.data)

        # 按优先级查找源语言：中文 > 日语 > 英语
        supported_languages = ['zh', 'ja', 'en']

        source_lang = None
        source_translation = None
        for lang in supported_languages:
            if lang in translations_data and translations_data[lang].get('title'):
                source_lang = lang
                source_translation = translations_data[lang]
                break

        # 如果没有提供任何翻译，不做任何更新
        if not source_lang:
            response_serializer = self.get_serializer(project)
            return Response(response_serializer.data)

        # 更新所有语言的翻译
        all_languages = ['zh', 'en', 'ja']
        for target_lang in all_languages:
            if target_lang == source_lang:
                # 源语言直接保存
                ProjectTranslation.objects.update_or_create(
                    project=project,
                    language=target_lang,
                    defaults={
                        'title': source_translation.get('title', ''),
                        'description': source_translation.get('description', ''),
                        'info': source_translation.get('info', []),
                    }
                )
            else:
                # 其他语言自动翻译
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

                translated_info = []
                source_info = source_translation.get('info', [])
                for info_item in source_info:
                    if info_item:
                        translated_item = translate_text(
                            info_item,
                            source_lang,
                            target_lang
                        )
                        translated_info.append(translated_item)

                ProjectTranslation.objects.update_or_create(
                    project=project,
                    language=target_lang,
                    defaults={
                        'title': translated_title,
                        'description': translated_description,
                        'info': translated_info,
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
        return ProjectSkill.objects.all().order_by('-created_at')


class ProjectSkillDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProjectSkillSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    queryset = ProjectSkill.objects.all()
    lookup_field = 'id'
    lookup_url_kwarg = 'skill_id'
