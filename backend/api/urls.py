from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from api import views as api_views

urlpatterns = [
    path('user/token/', api_views.MyTokenObtainPairView.as_view()),
    path('user/token/refresh/', TokenRefreshView.as_view()),
    path('user/register/', api_views.RegisterView.as_view()),
    path('user/profile/<user_id>/', api_views.ProfileView.as_view()),

    # Post Endpoint
    path('post/category/list/', api_views.CategoryListApiView.as_view()),
    path('post/category/create/', api_views.CategoryCreateApiView.as_view()),
    path('post/category/update/<int:category_id>/',
         api_views.CategoryUpdateAPIView.as_view()),
    path('post/category/posts/<category_slug>/',
         api_views.PostCategoryListApiView.as_view()),
    path('post/lists/', api_views.PostListAPIView.as_view()),
    path('post/detail/<slug>/', api_views.PostDetailAPIView.as_view()),
    path('post/like-post/', api_views.LikePostAPIView.as_view()),
    path('post/comment-post/', api_views.PostCommentAPIView.as_view()),
    path('post/bookmark-post/', api_views.BookmarkPostAPIView.as_view()),

    path('author/dashboard/stats/<user_id>/',
         api_views.DashboradAPIView.as_view()),
    path('author/dashboard/comment-list/<user_id>/',
         api_views.DashboardCommentLists.as_view()),
    path('author/dashboard/noti-list/<user_id>/',
         api_views.DashboardNotificationsList.as_view()),
    path('author/dashboard/mark-noti-seen/',
         api_views.DashboardMarkNotificationAsSeen.as_view()),
    path('author/dashboard/reply-comment/',
         api_views.DashboardReplyCommentAPIView.as_view()),
    path('author/dashboard/post-create/',
         api_views.DashboardPostCreateAPIView.as_view()),
    path('author/dashboard/post-detail/<user_id>/<post_id>/',
         api_views.DashboardPostUpdateAPIView.as_view()),
    path('oss/credentials/', api_views.get_oss_credentials, name='oss-credentials'),
]
