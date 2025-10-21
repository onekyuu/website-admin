from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from api.core import views

urlpatterns = [
    # 认证
    path('user/token/', views.MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('user/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('user/register/', views.RegisterView.as_view(), name='user_register'),
    
    # 用户
    path('user/profile/<user_id>/', views.ProfileView.as_view(), name='user_profile'),
]