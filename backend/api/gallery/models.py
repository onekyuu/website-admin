from django.db import models
from api.models import User
import shortuuid


class Gallery(models.Model):
    slug = models.SlugField(max_length=255, default='',
                            blank=True, null=True)  # 暂时允许 null
    title = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    image_url = models.URLField(max_length=500)
    thumbnail_url = models.URLField(max_length=500)

    # EXIF data
    taken_at = models.DateTimeField(null=True, blank=True)
    camera_make = models.CharField(max_length=100, blank=True)
    camera_model = models.CharField(max_length=100, blank=True)
    lens_model = models.CharField(max_length=100, blank=True)

    shooting_params = models.JSONField(default=dict, blank=True)
    photo_properties = models.JSONField(default=dict, blank=True)
    location_info = models.JSONField(default=dict, blank=True)

    # Metadata
    category = models.CharField(max_length=50, blank=True)
    tags = models.JSONField(default=list, blank=True)

    # Status
    is_featured = models.BooleanField(default=False)
    is_published = models.BooleanField(default=True)
    view_count = models.IntegerField(default=0)

    # User and timestamps
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Photo"
        verbose_name_plural = "Photos"
        ordering = ['-taken_at', '-created_at']
        indexes = [
            models.Index(fields=['-taken_at']),
            models.Index(fields=['-created_at']),
            models.Index(fields=['is_published', 'is_featured']),
        ]

    def __str__(self):
        return self.title or f"Photo {self.id}"

    def save(self, *args, **kwargs):
        # 如果 slug 为空，自动生成
        if not self.slug:
            self.slug = f"photo-{shortuuid.uuid()[:8]}"
            # 确保 slug 唯一
            while Gallery.objects.filter(slug=self.slug).exists():
                self.slug = f"photo-{shortuuid.uuid()[:8]}"
        super().save(*args, **kwargs)

    def get_exif_summary(self):
        """Get EXIF information summary"""
        parts = []
        params = self.shooting_params if isinstance(
            self.shooting_params, dict) else {}

        if params.get('focal_length'):
            parts.append(params['focal_length'])
        if params.get('aperture'):
            parts.append(params['aperture'])
        if params.get('shutter_speed'):
            parts.append(params['shutter_speed'])
        if params.get('iso'):
            parts.append(params['iso'])

        return " | ".join(parts) if parts else "No EXIF information"
