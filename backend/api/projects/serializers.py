from rest_framework import serializers
from api.projects.models import Project, ProjectTranslation, ProjectSkill


class ProjectSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectSkill
        fields = ['id', 'name', 'type', 'image_url', 'created_at', 'updated_at']


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

    class Meta:
        model = Project
        fields = ["id", "translations", "slug", "created_by", 
                  "created_at", "updated_at", "skills", "skill_ids", "images"]
        read_only_fields = ['slug', 'created_by', 'created_at', 'updated_at']

    def get_translations(self, obj):
        return {
            t.language: {
                "title": t.title,
                "description": t.description,
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
