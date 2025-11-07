from django.urls import path
from api.oss import views

urlpatterns = [
    path('oss/credentials/', views.OSSCredentialsView.as_view(),
         name='oss-credentials'),
    path('oss/images/upload/', views.OSSImageUploadView.as_view(), name='oss-upload'),
    path('oss/images/list/', views.OSSImageListView.as_view(), name='oss-list'),
    path('oss/images/delete/', views.OSSImageDeleteView.as_view(), name='oss-delete'),
    path('oss/images/delete/batch/',
         views.OSSImageBatchDeleteView.as_view(), name='oss-delete-batch'),
]
