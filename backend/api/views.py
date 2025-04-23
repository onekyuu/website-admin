from django.shortcuts import render

# Create your views here.
from django.http import JsonResponse
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.db.models import Sum

# Restframework
from rest_framework import status
from rest_framework.decorators import api_view, APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken

from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from datetime import datetime

# Others
import json
import random

# Custom Imports
from api import models as api_models
from api import serializer as api_serializer


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = api_serializer.MyTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    queryset = api_models.User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = api_serializer.RegisterSerializer

    @swagger_auto_schema(
        operation_summary="Register a new user",
        request_body=api_serializer.RegisterSerializer,
        responses={201: "User created successfully", 400: "Bad request"}
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class ProfileView(generics.RetrieveUpdateAPIView):
    queryset = api_models.Profile.objects.all()
    permission_classes = [AllowAny]
    serializer_class = api_serializer.ProfileSerializer

    @swagger_auto_schema(
        operation_summary="Get user profile",
        responses={200: api_serializer.ProfileSerializer}
    )
    def get_object(self):
        user_id = self.kwargs['user_id']
        user = api_models.User.objects.get(id=user_id)
        profile = api_models.Profile.objects.get(user=user)
        return profile


class CategoryListApiView(generics.ListAPIView):
    serializer_class = api_serializer.CategorySerializer
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_summary="Get all categories",
        responses={200: api_serializer.CategorySerializer(many=True)}
    )
    def get_queryset(self):
        return api_models.Category.objects.all()


class PostCategoryListApiView(generics.ListAPIView):
    serializer_class = api_serializer.PostSerializer
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_summary="Get posts by category",
        responses={200: api_serializer.PostSerializer(many=True)}
    )
    def get_queryset(self):
        category_slug = self.kwargs['category_slug']
        category = api_models.Category.objects.get(slug=category_slug)
        posts = api_models.Post.objects.filter(
            category=category, status='Active')
        return posts


class PostListAPIView(generics.ListAPIView):
    serializer_class = api_serializer.PostSerializer
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_summary="Get all posts",
        responses={200: api_serializer.PostSerializer(many=True)}
    )
    def get_queryset(self):
        return api_models.Post.objects.filter(status='Active')


class PostDetailAPIView(generics.RetrieveAPIView):
    serializer_class = api_serializer.PostSerializer
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_summary="Get post details",
        responses={200: api_serializer.PostSerializer}
    )
    def get_object(self):
        slug = self.kwargs['slug']
        post = api_models.Post.objects.get(slug=slug, status='Active')
        post.view += 1
        post.save()
        return post


class LikePostAPIView(APIView):
    @swagger_auto_schema(
        operation_summary="Like or unlike a post",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'user_id': openapi.Schema(type=openapi.TYPE_INTEGER),
                'post_id': openapi.Schema(type=openapi.TYPE_INTEGER),
            },
        ),
        responses={200: "Post liked/unliked successfully"}
    )
    def post(self, request):
        user_id = request.data["user_id"]
        post_id = request.data["post_id"]

        user = api_models.User.objects.get(id=user_id)
        post = api_models.Post.objects.get(id=post_id)

        if user in post.likes.all():
            post.likes.remove(user)
            return Response({"message": "Post unliked"}, status=status.HTTP_200_OK)
        else:
            post.likes.add(user)
            api_models.Notification.objects.create(
                user=post.user,
                post=post,
                type='Like',
            )
            return Response({"message": "Post liked"}, status=status.HTTP_200_OK)


class PostCommentAPIView(APIView):

    @swagger_auto_schema(
        operation_summary="Add a comment to a post",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'post_id': openapi.Schema(type=openapi.TYPE_INTEGER),
                'name': openapi.Schema(type=openapi.TYPE_STRING),
                'email': openapi.Schema(type=openapi.TYPE_STRING),
                'comment': openapi.Schema(type=openapi.TYPE_STRING),
            },
        ),
        responses={201: "Comment added successfully"}
    )
    def post(self, request):
        post_id = request.data["post_id"]
        name = request.data["name"]
        email = request.data["email"]
        comment = request.data["comment"]

        post = api_models.Post.objects.get(id=post_id)
        api_models.Comment.objects.create(
            post=post,
            name=name,
            email=email,
            comment=comment
        )
        api_models.Notification.objects.create(
            user=post.user,
            post=post,
            type='Comment',
        )
        return Response({"message": "Comment added"}, status=status.HTTP_201_CREATED)


class BookmarkPostAPIView(APIView):
    @swagger_auto_schema(
        operation_summary="Bookmark a post",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'user_id': openapi.Schema(type=openapi.TYPE_INTEGER),
                'post_id': openapi.Schema(type=openapi.TYPE_INTEGER),
            },
        ),
        responses={200: "Post bookmarked successfully"}
    )
    def post(self, request):
        user_id = request.data["user_id"]
        post_id = request.data["post_id"]

        user = api_models.User.objects.get(id=user_id)
        post = api_models.Post.objects.get(id=post_id)

        bookmark = api_models.Bookmark.objects.filter(
            user=user, post=post).first()

        if bookmark:
            bookmark.delete()
            return Response({"message": "Post unbookmarked"}, status=status.HTTP_200_OK)
        else:
            api_models.Bookmark.objects.create(
                user=user,
                post=post
            )
            # api_models.Notification.objects.create(
            #     user=post.user,
            #     post=post,
            #     type='Bookmark',
            # )
            return Response({"message": "Post bookmarked"}, status=status.HTTP_201_CREATED)
