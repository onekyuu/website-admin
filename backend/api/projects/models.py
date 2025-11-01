from django.db import models
from django.utils.text import slugify
import shortuuid
from api.core.models import User, Profile


class Project(models.Model):
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    slug = models.SlugField(unique=True, null=True, blank=True)

    class Meta:
        db_table = 'api_project'
        ordering = ['-created_at']

    def __str__(self):
        translation = self.translations.filter(language='zh').first()
        return str(translation.title) if translation else f"Project {self.id}"

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            unique_slug = f"{base_slug}-{shortuuid.uuid()[:8]}"
            self.slug = unique_slug
        super().save(*args, **kwargs)


class ProjectTranslation(models.Model):
    LANGUAGE_CHOICES = (
        ('zh', 'Chinese'),
        ('en', 'English'),
        ('ja', 'Japanese'),
    )
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name='translations')
    language = models.CharField(
        max_length=2, choices=LANGUAGE_CHOICES, db_index=True)
    title = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    form_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'api_project_translation'
        unique_together = ('project', 'language')

    def __str__(self):
        return f"{self.title} - {self.project.slug} - {self.language}"
