from django.shortcuts import render

# Create your views here.
from django.http import JsonResponse
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncMonth, TruncDay
from django.utils import timezone
from django.shortcuts import get_object_or_404


# Restframework
from rest_framework import status
from rest_framework.decorators import api_view, APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission, SAFE_METHODS, IsAuthenticatedOrReadOnly
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.pagination import PageNumberPagination

from aliyunsdkcore.client import AcsClient
from aliyunsdksts.request.v20150401 import AssumeRoleRequest
from aliyunsdkcore.profile import region_provider

from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from datetime import datetime, timedelta

from dateutil.relativedelta import relativedelta


from openai import OpenAI
import os
import json
from bs4 import BeautifulSoup

# Others
import json
import random

# Custom Imports
from api import models as api_models
from api import serializer as api_serializer

client = OpenAI(
    # This is the default and can be omitted
    api_key=os.environ.get("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com"
)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10  # 每页20条
    page_size_query_param = 'page_size'
    max_page_size = 100


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


class IsOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        # 允许GET、HEAD、OPTIONS请求
        if request.method in SAFE_METHODS:
            return True
        # 检查是否是用户本人或超级用户
        return obj.user == request.user or request.user.is_superuser


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = api_serializer.ProfileSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def get(self, request, user_id):
        try:
            user = api_models.User.objects.get(id=user_id)
            profile = api_models.Profile.objects.get(user=user)
            serializer = api_serializer.ProfileSerializer(profile)
            return Response(serializer.data)
        except (api_models.User.DoesNotExist, api_models.Profile.DoesNotExist):
            return Response({"error": "用户不存在"}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request, user_id):
        try:
            user = api_models.User.objects.get(id=user_id)
            profile = api_models.Profile.objects.get(user=user)
            self.check_object_permissions(
                request, profile)  # 检查权限（IsOwnerOrReadOnly）

            serializer = api_serializer.ProfileSerializer(
                profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except (api_models.User.DoesNotExist, api_models.Profile.DoesNotExist):
            return Response({"error": "用户不存在"}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, user_id):
        user = get_object_or_404(api_models.User, id=user_id)
        profile = get_object_or_404(api_models.Profile, user=user)
        self.check_object_permissions(request, profile)

        serializer = self.get_serializer(
            profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CategoryCreateApiView(generics.CreateAPIView):
    serializer_class = api_serializer.CategorySerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # 将当前登录用户设置为创建者
        serializer.save(user=self.request.user)


class CategoryUpdateAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = api_serializer.CategorySerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]  # 确保只有创建者可以修改

    def get_object(self):
        category_id = self.kwargs['category_id']
        return get_object_or_404(api_models.Category, id=category_id)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # 执行自定义逻辑，例如检查是否有关联的文章
        posts_count = api_models.Post.objects.filter(category=instance).count()
        if posts_count > 0:
            return Response(
                {"error": f"无法删除，该分类下还有 {posts_count} 篇文章。"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 执行删除操作
        self.perform_destroy(instance)
        return Response({"message": "分类已成功删除"}, status=status.HTTP_204_NO_CONTENT)


class CategoryListApiView(generics.ListAPIView):
    serializer_class = api_serializer.CategorySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return api_models.Category.objects.all()


class PostCategoryListApiView(generics.ListAPIView):
    serializer_class = api_serializer.PostSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        category_slug = self.kwargs['category_slug']
        category = api_models.Category.objects.get(slug=category_slug)
        posts = api_models.Post.objects.filter(
            category=category, status='Active')
        return posts


class PostListAPIView(generics.ListAPIView):
    serializer_class = api_serializer.PostSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return api_models.Post.objects.filter(status='Active')


class PostDetailAPIView(generics.RetrieveAPIView):
    serializer_class = api_serializer.PostSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        slug = self.kwargs['slug']
        post = api_models.Post.objects.get(slug=slug, status='Active')
        post.views += 1
        post.save()
        return post


class LikePostAPIView(APIView):
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


class DashboradAPIView(APIView):
    permission_classes = [AllowAny]

    def get_monthly_post_counts(self, user):
        # 生成近12个月月份
        end_date = timezone.now().replace(day=1)
        months = [end_date - relativedelta(months=i)
                  for i in range(11, -1, -1)]
        month_labels = [m.strftime('%Y-%m') for m in months]

        # 实际数据
        raw_data = (
            api_models.Post.objects
            .filter(user=user, date__gte=months[0])
            .annotate(month=TruncMonth('date'))
            .values('month')
            .annotate(count=Count('id'))
        )

        stats_dict = {item['month'].strftime(
            '%Y-%m'): item['count'] for item in raw_data}

        return [
            {"month": month, "count": stats_dict.get(month, 0)}
            for month in month_labels
        ]

    def get(self, request, user_id):
        user = api_models.User.objects.get(id=user_id)

        views = api_models.Post.objects.filter(
            user=user).aggregate(view=Sum('views'))["view"] or 0
        posts = api_models.Post.objects.filter(user=user).count()
        likes = api_models.Post.objects.filter(user=user).aggregate(
            total_likes=Count('likes'))["total_likes"] or 0
        bookmarks = api_models.Bookmark.objects.filter(post__user=user).count()

        category_counts = list(api_models.Category.objects
                               .all()
                               .annotate(post_count=Count('post', filter=Q(post__user=user)))
                               .values('id', 'title', 'slug', 'post_count'))

        monthly_posts = self.get_monthly_post_counts(user)

        popular_posts = list(api_models.Post.objects
                             .filter(user=user)
                             .annotate(like_count=Count('likes'))
                             .order_by('-like_count', '-date')[:5]
                             .values('id', 'slug', 'date', 'like_count', 'image'))

        category_likes = list(api_models.Category.objects
                              .filter(post__user=user)
                              .annotate(like_count=Count('post__likes'))
                              .values('title', 'like_count'))
        one_year_ago = timezone.now() - timedelta(days=365)
        daily_posts = list(
            api_models.Post.objects
            .filter(user=user, date__gte=one_year_ago)
            .annotate(day=TruncDay('date'))
            .values('day')
            .annotate(count=Count('id'))
            .order_by('day')
        )

        data = {
            "views": views,
            "posts": posts,
            "likes": likes,
            "comments": 0,  # 如果之后加上评论模型可以再统计
            "bookmarks": bookmarks,
            "categories": category_counts,
            "monthly_posts": monthly_posts,
            "popular_posts": popular_posts,
            "category_likes": category_likes,
            "daily_posts": daily_posts,
        }

        serializer = api_serializer.DashboardSerializer(data)
        return Response(serializer.data)


class DashboardPostLists(generics.ListAPIView):
    serializer_class = api_serializer.PostSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        user_id = self.kwargs['user_id']
        user = api_models.User.objects.get(id=user_id)
        return api_models.Post.objects.filter(user=user).order_by("-id")


class DashboardCommentLists(generics.ListAPIView):
    serializer_class = api_serializer.CommentSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user_id = self.kwargs['user_id']
        user = api_models.User.objects.get(id=user_id)
        return api_models.Comment.objects.filter(post__user=user).order_by("-id")


class DashboardNotificationsList(generics.ListAPIView):
    serializer_class = api_serializer.NotificationSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user_id = self.kwargs['user_id']
        user = api_models.User.objects.get(id=user_id)
        return api_models.Notification.objects.all(seen=False, user=user)


class DashboardMarkNotificationAsSeen(APIView):

    def post(self, request):
        noti_id = request.data["noti_id"]
        noti = api_models.Notification.objects.get(id=noti_id)
        noti.seen = True
        noti.save()
        return Response({"message": "Notification seen"}, status=status.HTTP_200_OK)


class DashboardReplyCommentAPIView(APIView):

    def post(self, request):
        comment_id = request.data["comment_id"]
        reply = request.data["reply"]

        comment = api_models.Comment.objects.get(id=comment_id)
        comment.reply = reply
        comment.save()
        return Response({"message": "Reply added"}, status=status.HTTP_200_OK)


def translate_rich_text(html, target_lang, source_lang="zh"):
    """保留 HTML 结构，只翻译其中的文字内容"""
    soup = BeautifulSoup(html, "html.parser")

    for tag in soup.find_all(string=True):
        if tag.strip():  # 只翻译非空字符串
            try:
                translated = call_openai_translate(
                    tag, target_lang, source_lang)
                tag.replace_with(translated)
            except Exception as e:
                print(f"段落翻译失败: {tag[:20]}... -> {e}")
                continue

    return str(soup)


def call_openai_translate(text, target_lang, source_lang="zh"):
    """使用 DeepSeek 接口翻译"""
    prompt = f"请将以下文本从{source_lang}翻译为{target_lang}：\n{text}"
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": "你是一个精准的翻译助手，只返回翻译后的纯文本，不要解释"},
            {"role": "user", "content": prompt}
        ]
    )
    return response.choices[0].message.content.strip()


class DashboardPostCreateAPIView(generics.CreateAPIView):
    serializer_class = api_serializer.PostSerializer
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_summary="Create a new post",
        request_body=api_serializer.PostSerializer,
        responses={201: "Post created successfully", 400: "Bad request"}
    )
    def create(self, request, *args, **kwargs):
        data = request.data

        user = api_models.User.objects.get(id=data["user_id"])
        category = api_models.Category.objects.get(id=data["category"])

        post = api_models.Post.objects.create(
            user=user,
            image=data.get("image"),
            # tags=data.get("tags"),
            category=category,
            status=data.get("status", "Active"),
        )

        translations_data = {
            "zh": data.get("zh"),
            "en": data.get("en"),
            "ja": data.get("ja"),
        }
        need_ai_generate = data.get("need_ai_generate", False)

        # 有内容的语言作为翻译源
        available_langs = {
            k: v for k, v in translations_data.items() if v and v.get("title")}
        missing_langs = [
            k for k, v in translations_data.items() if not v or not v.get("title")]

        for lang_code in ["zh", "en", "ja"]:
            translation = translations_data.get(lang_code)

            if translation and translation.get("title"):
                # 用户直接提交了翻译，原样保存
                api_models.PostTranslation.objects.create(
                    post=post,
                    language=lang_code,
                    title=translation.get("title"),
                    description=translation.get("description"),
                    content=translation.get("content"),
                    is_ai_generated=translation.get("is_ai_generated", False)
                )
            else:
                # AI 自动补全
                if not available_langs or not need_ai_generate:
                    continue

                # 用第一个有内容的语言作为源
                source_lang, source_data = list(available_langs.items())[0]

                try:
                    translated_title = call_openai_translate(
                        source_data["title"], lang_code, source_lang)
                    translated_description = call_openai_translate(
                        source_data["description"], lang_code, source_lang)
                    translated_content = translate_rich_text(
                        source_data["content"], lang_code, source_lang)

                    api_models.PostTranslation.objects.create(
                        post=post,
                        language=lang_code,
                        title=translated_title,
                        description=translated_description,
                        content=translated_content,
                        is_ai_generated=True
                    )
                except Exception as e:
                    print(f"[翻译失败] {lang_code}: {str(e)}")
                    return Response(
                        {"error": f"翻译失败: {lang_code} - {str(e)}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

        return Response({"message": "Post created with translations", "post": {
            "id": post.id,
            "user": post.user.id,
            "image": post.image.url if post.image else None,
            "category": post.category.id,
            "status": post.status,
            "translations": [
                {
                    "language": translation.language,
                    "title": translation.title,
                    "description": translation.description,
                    "content": translation.content
                } for translation in post.translations.all()
            ]
        }}, status=status.HTTP_201_CREATED)


class DashboardPostUpdateAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = api_serializer.PostSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        user_id = self.kwargs['user_id']
        post_id = self.kwargs['post_id']

        user = api_models.User.objects.get(id=user_id)
        post = api_models.Post.objects.get(id=post_id, user=user)
        return post

    def update(self, request, *args, **kwargs):
        data = request.data
        post_instance = self.get_object()
        updated = False  # 标记是否有修改

        # image = data.get("image")
        # tags = data.get("tags")
        category_id = data.get("category")
        # post_status = data.get("status")

        # if image != 'undefined' and image != post_instance.image:
        #     post_instance.image = image
        #     updated = True
        # if tags != post_instance.tags:
        #     post_instance.tags = tags
        #     updated = True
        if category_id:
            category = api_models.Category.objects.get(id=category_id)
            if post_instance.category != category:
                post_instance.category = category
                updated = True
        # if post_status and post_instance.status != post_status:
        #     post_instance.status = post_status
        #     updated = True

        if updated:
            post_instance.save()

        # 翻译内容的判断
        translations_data = {
            "zh": data.get("zh"),
            "en": data.get("en"),
            "ja": data.get("ja"),
        }
        translations_updated = False
        for lang_code, translation in translations_data.items():
            if translation:
                try:
                    post_translation = api_models.PostTranslation.objects.get(
                        post=post_instance,
                        language=lang_code
                    )
                    changed = False
                    for field in ["title", "description", "content"]:
                        new_val = translation.get(field)
                        old_val = getattr(post_translation, field)
                        if new_val is not None and new_val != old_val:
                            setattr(post_translation, field, new_val)
                            changed = True
                    if changed:
                        post_translation.is_ai_generated = False
                        post_translation.save()
                        translations_updated = True
                except api_models.PostTranslation.DoesNotExist:
                    api_models.PostTranslation.objects.create(
                        post=post_instance,
                        language=lang_code,
                        title=translation.get("title"),
                        description=translation.get("description"),
                        content=translation.get("content"),
                        is_ai_generated=translation.get(
                            "is_ai_generated", False),
                    )
                    translations_updated = True

        if updated or translations_updated:
            return Response({"message": "Post updated"}, status=status.HTTP_200_OK)
        else:
            return Response({"message": "No changes detected"}, status=status.HTTP_200_OK)


region_provider.modify_point('Sts', 'cn-hangzhou', 'sts.aliyuncs.com')


def get_oss_credentials(request):
    access_key_id = os.getenv('ALIYUN_OSS_ACCESS_KEY_ID')
    access_key_secret = os.getenv('ALIYUN_OSS_ACCESS_KEY_SECRET')
    role_arn = os.getenv('OSS_ROLE_ARN')
    bucket_name = os.getenv('OSS_BUCKET')

    try:
        client = AcsClient(
            access_key_id,
            access_key_secret,
            'cn-hangzhou',
            timeout=20
        )

        request = AssumeRoleRequest.AssumeRoleRequest()
        request.set_RoleArn(role_arn)
        request.set_RoleSessionName('django-oss-upload')
        request.set_DurationSeconds(900)

        policy = {
            "Statement": [{
                "Effect": "Allow",
                "Action": ["oss:PutObject", "oss:GetObject"],
                "Resource": [f"acs:oss:*:*:{bucket_name}/uploads/*"]
            }],
            "Version": "1"
        }
        request.set_Policy(json.dumps(policy))

        response = client.do_action_with_exception(request)
        result = json.loads(response)
        return JsonResponse({
            'StatusCode': 200,
            'AccessKeyId': result['Credentials']['AccessKeyId'],
            'AccessKeySecret': result['Credentials']['AccessKeySecret'],
            'SecurityToken': result['Credentials']['SecurityToken'],
            'Expiration': result['Credentials']['Expiration'],
            'Region': os.getenv('OSS_REGION'),
            'Bucket': bucket_name
        })

    except Exception as e:
        # 添加详细日志
        print(f"[ERROR] STS Request Failed: {str(e)}")
        return JsonResponse(
            {'error': 'STS Credential Generation Failed', 'detail': str(e)},
            status=500
        )
