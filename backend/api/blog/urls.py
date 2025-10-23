from django.urls import path
from api.blog import views

urlpatterns = [
    path('post/category/list/', views.CategoryListApiView.as_view()),
    path('post/category/create/', views.CategoryCreateApiView.as_view()),
    path('post/category/update/<int:category_id>/',
         views.CategoryUpdateAPIView.as_view()),
    path('post/category/posts/<category_slug>/',
         views.PostCategoryListApiView.as_view()),
    path('post/lists/', views.PostListAPIView.as_view()),
    path('post/detail/<slug>/', views.PostDetailAPIView.as_view()),
    path('post/like-post/', views.LikePostAPIView.as_view()),
    path('post/comment-post/', views.PostCommentAPIView.as_view()),
    path('post/bookmark-post/', views.BookmarkPostAPIView.as_view()),

    path('author/dashboard/stats/<user_id>/',
         views.DashboradAPIView.as_view()),
    path('author/dashboard/comment-list/<user_id>/',
         views.DashboardCommentLists.as_view()),
    path('author/dashboard/noti-list/<user_id>/',
         views.DashboardNotificationsList.as_view()),
    path('author/dashboard/mark-noti-seen/',
         views.DashboardMarkNotificationAsSeen.as_view()),
    path('author/dashboard/reply-comment/',
         views.DashboardReplyCommentAPIView.as_view()),
    path('author/dashboard/post-create/',
         views.DashboardPostCreateAPIView.as_view()),
    path('author/dashboard/post-detail/<user_id>/<post_id>/',
         views.DashboardPostUpdateAPIView.as_view()),
#     path('oss/credentials/', views.get_oss_credentials, name='oss-credentials'),
#     path('oss/images/list/', views.list_oss_images, name='oss-images-list'),
]
