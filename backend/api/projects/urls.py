from django.urls import path
from api.projects import views

urlpatterns = [
    path('projects/list/', views.ProjectListApiView.as_view()),
    path('projects/create/', views.ProjectCreateApiView.as_view()),
    path('projects/detail/<int:project_id>/',
         views.ProjectDetailAPIView.as_view()),
    path('projects/delete/<int:project_id>/',
         views.ProjectDeleteAPIView.as_view()),
]
