from django.urls import path
from api.oss import views

urlpatterns = [
    path('oss/credentials/', views.get_oss_credentials, name='oss-credentials'),
    path('oss/images/list/', views.list_oss_images, name='oss-images-list'),
]
