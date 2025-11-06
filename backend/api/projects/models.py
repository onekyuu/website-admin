from django.db import models
from django.utils.text import slugify
import shortuuid
from api.core.models import User


class Project(models.Model):
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    slug = models.SlugField(unique=True, null=True, blank=True)
    skills = models.ManyToManyField(
        'ProjectSkill', related_name='projects', blank=True)
    images = models.JSONField(default=list, blank=True)
    is_featured = models.BooleanField(default=False)

    class Meta:
        db_table = 'api_project'
        ordering = ['-created_at']

    def __str__(self):
        return self.slug

    def save(self, *args, **kwargs):
        if not self.slug:
            unique_slug = f"project-{shortuuid.uuid()[:8]}"
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
    description = models.TextField(null=True, blank=True)  # Markdown 格式
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'api_project_translation'
        unique_together = ('project', 'language')

    def __str__(self):
        return f"{self.title} - {self.project.slug} - {self.language}"


class ProjectSkill(models.Model):
    SKILL_TYPE = (
        ('Frontend', 'Frontend'),
        ('Backend', 'Backend'),
        ('DevOps', 'DevOps'),
    )
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    type = models.CharField(max_length=20, choices=SKILL_TYPE)
    image_url = models.URLField(null=True, blank=True)

    class Meta:
        db_table = 'api_project_skill'
        ordering = ['name']

    def __str__(self):
        return str(self.name)
