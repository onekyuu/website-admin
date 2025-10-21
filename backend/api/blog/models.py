from django.db import models
from django.utils.text import slugify
import shortuuid
from api.core.models import User, Profile


class Category(models.Model):
    title = models.CharField(max_length=100)
    image = models.URLField(max_length=500, null=True, blank=True)
    slug = models.SlugField(unique=True, null=True, blank=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, blank=True)

    class Meta:
        db_table = 'api_category'
        verbose_name_plural = "Categories"

    def __str__(self):
        return str(self.title)

    def save(self, *args, **kwargs):
        if self.slug is None or self.slug == "":
            self.slug = slugify(self.title)
        super(Category, self).save(*args, **kwargs)


class Post(models.Model):
    STATUS = (
        ('Active', 'Active'),
        ('Draft', 'Draft'),
        ('Disabled', 'Disabled'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    profile = models.ForeignKey(
        Profile, on_delete=models.CASCADE, null=True, blank=True)
    image = models.URLField(max_length=500, null=True, blank=True)
    slug = models.SlugField(unique=True, null=True, blank=True)
    category = models.ForeignKey(
        Category, on_delete=models.CASCADE, null=True, blank=True, related_name='posts')
    status = models.CharField(max_length=100, choices=STATUS, default='Draft')
    views = models.IntegerField(default=0)
    likes = models.ManyToManyField(User, related_name='likes_user', blank=True)
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'api_post'
        ordering = ['-date']
        verbose_name_plural = "Posts"

    def __str__(self):
        return str(self.slug)

    def save(self, *args, **kwargs):
        if self.slug is None or self.slug == "":
            self.slug = shortuuid.ShortUUID().random(length=8)
        super(Post, self).save(*args, **kwargs)


class PostTranslation(models.Model):
    LANGUAGE_CHOICES = (
        ('zh', 'Chinese'),
        ('en', 'English'),
        ('ja', 'Japanese'),
    )

    post = models.ForeignKey(
        Post, on_delete=models.CASCADE, related_name='translations')
    language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES)
    title = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    content = models.TextField()
    is_ai_generated = models.BooleanField(default=False)

    class Meta:
        db_table = 'api_posttranslation'
        unique_together = ('post', 'language')

    def __str__(self):
        return f"{self.post.slug} - {self.language}"


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    email = models.EmailField()
    comment = models.TextField(blank=True, null=True)
    reply = models.TextField(blank=True, null=True)
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.post.slug}"

    class Meta:
        db_table = 'api_comment'
        verbose_name_plural = "Comments"


class Bookmark(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.post.slug}"

    class Meta:
        db_table = 'api_bookmark'
        verbose_name_plural = "Bookmarks"


class Notification(models.Model):
    NOTIFICATION_TYPE = (
        ('Like', 'Like'),
        ('Comment', 'Comment'),
        ('Bookmark', 'Bookmark'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(
        Post, on_delete=models.CASCADE, null=True, blank=True)
    type = models.CharField(max_length=100, choices=NOTIFICATION_TYPE)
    seen = models.BooleanField(default=False)
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.type}"

    class Meta:
        db_table = 'api_notification'
        verbose_name_plural = "Notifications"
