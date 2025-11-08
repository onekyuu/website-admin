from django.db import models
from api.models import User


class Gallery(models.Model):
    # Basic information
    title = models.CharField(max_length=200, blank=True, verbose_name="Title")
    description = models.TextField(blank=True, verbose_name="Description")
    image_url = models.URLField(max_length=500, verbose_name="Image URL")
    thumbnail_url = models.URLField(
        max_length=500, blank=True, verbose_name="Thumbnail URL")

    # EXIF Information
    taken_at = models.DateTimeField(
        null=True, blank=True, verbose_name="Taken At")
    camera_make = models.CharField(
        max_length=100, blank=True, verbose_name="Camera Make")
    camera_model = models.CharField(
        max_length=100, blank=True, verbose_name="Camera Model")
    lens_model = models.CharField(
        max_length=100, blank=True, verbose_name="Lens Model")

    # Shooting parameters (stored as JSON object)
    shooting_params = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Shooting Parameters",
        help_text="Contains focal_length, aperture, shutter_speed, iso"
    )

    # Photo properties (stored as JSON object)
    photo_properties = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Photo Properties",
        help_text="Contains width, height, file_size"
    )

    # Location information (stored as JSON object)
    location_info = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Location Information",
        help_text="Contains latitude, longitude, location"
    )

    # Classification and display
    category = models.CharField(
        max_length=50, blank=True, verbose_name="Category")
    tags = models.JSONField(default=list, blank=True, verbose_name="Tags")
    is_featured = models.BooleanField(default=False, verbose_name="Featured")
    is_published = models.BooleanField(default=True, verbose_name="Published")
    view_count = models.IntegerField(default=0, verbose_name="View Count")

    # System fields
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='gallery_photos',
        verbose_name="Uploaded By"
    )
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name="Created At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated At")

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
