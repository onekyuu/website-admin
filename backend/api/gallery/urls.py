from django.urls import path
from api.gallery import views

urlpatterns = [
    path('gallery/list/', views.GalleryListView.as_view(), name='gallery-list'),
    path('gallery/create/', views.GalleryCreateView.as_view(), name='gallery-create'),
    path('gallery/detail/<slug:slug>/', views.GalleryDetailView.as_view(),
         name='gallery-detail'),
    path('gallery/timeline/', views.GalleryTimelineView.as_view()),
    path('gallery/timeline/<int:year>/', views.GalleryYearView.as_view()),
]
