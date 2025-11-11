from rest_framework import serializers
from api.projects.models import Project, ProjectTranslation, ProjectSkill


class ProjectSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectSkill
        fields = ['id', 'name', 'type',
                  'image_url', 'created_at', 'updated_at']


class ProjectTranslationSerializer(serializers.ModelSerializer):
    info = serializers.ListField(
        child=serializers.CharField(max_length=500),
        required=False,
        allow_empty=True,
        min_length=0,
        max_length=4
    )
    challenges = serializers.ListField(
        child=serializers.CharField(max_length=500),
        required=False,
        allow_empty=True,
    )
    what_i_did = serializers.ListField(
        child=serializers.CharField(max_length=500),
        required=False,
        allow_empty=True,
    )
    subtitle = serializers.JSONField(required=False)
    extra_info = serializers.JSONField(required=False)

    class Meta:
        model = ProjectTranslation
        fields = ['language', 'title', 'subtitle', 'description', 'info',
                  'summary', 'introduction', 'challenges', 'solutions',
                  'what_i_did', 'extra_info']

    def validate_subtitle(self, value):
        """验证 subtitle 格式"""
        if value:
            if not isinstance(value, dict):
                raise serializers.ValidationError("Subtitle must be an object")

            required_keys = {'start', 'end'}
            if not required_keys.issubset(value.keys()):
                raise serializers.ValidationError(
                    "Subtitle must contain 'start' and 'end' fields"
                )

            if not isinstance(value.get('start'), str) or not isinstance(value.get('end'), str):
                raise serializers.ValidationError(
                    "Subtitle start and end must be strings"
                )

        return value


class ProjectSerializer(serializers.ModelSerializer):
    translations = serializers.SerializerMethodField()
    skills = ProjectSkillSerializer(many=True, read_only=True)
    skill_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    images = serializers.ListField(
        child=serializers.URLField(),
        required=False,
        default=list
    )
    detail_images = serializers.ListField(
        child=serializers.URLField(),
        required=False,
        default=list
    )
    need_ai_generate = serializers.BooleanField(required=False)

    class Meta:
        model = Project
        fields = ["id", "translations", "slug", "created_by",
                  "created_at", "updated_at", "skills", "skill_ids",
                  "images", "detail_images", "is_featured", "need_ai_generate",
                  "github_url", "live_demo_url"]
        read_only_fields = ['slug', 'created_by', 'created_at', 'updated_at']

    def get_translations(self, obj):
        return {
            t.language: {
                "title": t.title,
                "subtitle": t.subtitle,
                "description": t.description,
                "info": t.info,
                "summary": t.summary,
                "introduction": t.introduction,
                "challenges": t.challenges,
                "solutions": t.solutions,
                "what_i_did": t.what_i_did,
                "extra_info": t.extra_info,
            } for t in obj.translations.all()
        }

    def create(self, validated_data):
        skill_ids = validated_data.pop('skill_ids', [])
        project = super().create(validated_data)

        if skill_ids:
            project.skills.set(skill_ids)

        return project

    def update(self, instance, validated_data):
        skill_ids = validated_data.pop('skill_ids', None)
        project = super().update(instance, validated_data)

        if skill_ids is not None:
            project.skills.set(skill_ids)

        return project
