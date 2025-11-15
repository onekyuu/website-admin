from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # 核心功能（用户、认证）
    path('', include('api.core.urls')),

    # 博客功能
    path('', include('api.blog.urls')),

    # OSS 功能
    path('', include('api.oss.urls')),

    # 项目管理
    path('', include('api.projects.urls')),

    # 图库管理
    path('', include('api.gallery.urls')),

    # 发送邮件
    path('', include('api.contact.urls')),
]
