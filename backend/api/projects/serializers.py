from rest_framework import serializers
from api.core.utils import get_file_url
from api.projects.models import Project, ProjectTranslation


class ProjectSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    translations = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ["id", "translations", "slug",
                  "created_by", "created_at", "updated_at"]

    def get_translations(self, obj):
        return {
            t.language: {
                "title": t.title,
                "description": t.description,
                "form_data": t.form_data,
            } for t in obj.translations.all()
        }
