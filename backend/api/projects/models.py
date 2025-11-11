from django.db import models
from django.utils.text import slugify
from django.core.exceptions import ValidationError
import shortuuid
from api.core.models import User


def validate_subtitle(value):
    if not isinstance(value, dict):
        raise ValidationError("Subtitle must be a dictionary")

    required_keys = {'start', 'end'}
    if not required_keys.issubset(value.keys()):
        raise ValidationError(f"Subtitle must contain keys: {required_keys}")

    if not isinstance(value.get('start'), str) or not isinstance(value.get('end'), str):
        raise ValidationError("Subtitle start and end must be strings")


def validate_what_i_did(value):
    if not isinstance(value, list):
        raise ValidationError("what_i_did must be a list")

    for item in value:
        if not isinstance(item, dict):
            raise ValidationError(
                "Each item in what_i_did must be a dictionary")

        required_keys = {'title', 'description', 'icon'}
        if not required_keys.issubset(item.keys()):
            raise ValidationError(
                f"Each item must contain keys: {required_keys}")

        if not all(isinstance(item.get(key), str) for key in required_keys):
            raise ValidationError(
                "title, description, and icon must be strings")


class Project(models.Model):
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    slug = models.SlugField(unique=True, null=True, blank=True)
    skills = models.ManyToManyField(
        'ProjectSkill', related_name='projects', blank=True)
    images = models.JSONField(default=list, blank=True)
    detail_images = models.JSONField(default=list, blank=True)
    is_featured = models.BooleanField(default=False)
    need_ai_generate = models.BooleanField(default=True)
    github_url = models.URLField(max_length=500, null=True, blank=True)
    live_demo_url = models.URLField(max_length=500, null=True, blank=True)
    involved_areas = models.CharField(max_length=500, blank=True)
    tools = models.CharField(max_length=500, blank=True)

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
    subtitle = models.JSONField(
        default=dict,
        blank=True,
        validators=[validate_subtitle]
    )
    description = models.TextField(null=True, blank=True)
    info = models.JSONField(default=list, blank=True)
    summary = models.TextField(null=True, blank=True)
    tech_summary = models.TextField(null=True, blank=True)
    introduction = models.TextField(null=True, blank=True)
    challenges = models.JSONField(default=list, blank=True)
    solutions = models.TextField(null=True, blank=True)
    what_i_did = models.JSONField(
        default=list,
        blank=True,
        validators=[validate_what_i_did]
    )
    extra_info = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'api_project_translation'
        unique_together = ('project', 'language')

    def __str__(self):
        return f"{self.title} - {self.project.slug} - {self.language}"

    def clean(self):
        super().clean()
        if self.subtitle:
            validate_subtitle(self.subtitle)
        if self.what_i_did:
            validate_what_i_did(self.what_i_did)


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
