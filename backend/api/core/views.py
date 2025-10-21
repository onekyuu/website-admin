from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly
from rest_framework_simplejwt.views import TokenObtainPairView
from django.shortcuts import get_object_or_404
from drf_yasg.utils import swagger_auto_schema

from api.core.models import User, Profile
from api.core.serializers import (
    MyTokenObtainPairSerializer,
    RegisterSerializer,
    ProfileSerializer
)
from api.core.permissions import IsOwnerOrReadOnly


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    @swagger_auto_schema(
        operation_summary="Register a new user",
        request_body=RegisterSerializer,
        responses={201: "User created successfully", 400: "Bad request"}
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            profile = Profile.objects.get(user=user)
            serializer = ProfileSerializer(
                profile, context={'request': request})
            return Response(serializer.data)
        except (User.DoesNotExist, Profile.DoesNotExist):
            return Response({"error": "用户不存在"}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            profile = Profile.objects.get(user=user)
            self.check_object_permissions(request, profile)

            serializer = ProfileSerializer(
                profile, data=request.data, partial=True, context={'request': request}
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except (User.DoesNotExist, Profile.DoesNotExist):
            return Response({"error": "用户不存在"}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        profile = get_object_or_404(Profile, user=user)
        self.check_object_permissions(request, profile)

        serializer = self.get_serializer(
            profile, data=request.data, partial=True, context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
