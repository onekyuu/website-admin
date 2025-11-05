from django.urls import path
from api.projects import views

urlpatterns = [
    path('projects/list/', views.ProjectListApiView.as_view()),
    path('projects/create/', views.ProjectCreateApiView.as_view()),
    path('projects/detail/<slug:project_slug>/',
         views.ProjectDetailAPIView.as_view()),

    path('projects/skill/create/', views.ProjectSkillCreateApiView.as_view()),
    path('projects/skill/list/', views.ProjectSkillListApiView.as_view()),
    path('projects/skill/<int:skill_id>/', views.ProjectSkillDetailAPIView.as_view(),
         name='project-skill-detail'),  # 支持 GET, PUT, PATCH, DELETE
]
