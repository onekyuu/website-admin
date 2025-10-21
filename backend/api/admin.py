from django.contrib import admin

# Register your models here.
# from api import models as api_models
from api.core.models import User, Profile
from api.blog.models import Post, Category, Comment, Bookmark, Notification

admin.site.register(User)
admin.site.register(Profile)
admin.site.register(Category)
admin.site.register(Post)
admin.site.register(Comment)
admin.site.register(Bookmark)
admin.site.register(Notification)
