from django.urls import path
from api.oss import views

urlpatterns = [
    path('oss/credentials/', views.get_oss_credentials, name='oss-credentials'),
    path('oss/images/upload/', views.upload_oss_image, name='oss-images-upload'),
    path('oss/images/list/', views.list_oss_images, name='oss-images-list'),
    path('oss/images/delete/', views.delete_oss_image, name='oss-images-delete'),
    path('oss/images/delete/batch/', views.delete_oss_images_batch,
         name='oss-images-delete-batch'),
]
