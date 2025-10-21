from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from api import views as api_views

urlpatterns = [
    # 核心功能（用户、认证）
    path('', include('api.core.urls')),

    # 博客功能
    path('', include('api.blog.urls')),

    # 项目管理
    # path('projects/', include('api.projects.urls')),

    # 图库管理
    # path('gallery/', include('api.gallery.urls')),
]
