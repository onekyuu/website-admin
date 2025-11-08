from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncMonth, TruncDay
from django.utils import timezone
from django.shortcuts import get_object_or_404

# Restframework
from rest_framework import status
from rest_framework.decorators import APIView
from rest_framework.response import Response
from rest_framework import generics, viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny

from drf_yasg.utils import swagger_auto_schema
from datetime import timedelta
from dateutil.relativedelta import relativedelta

from openai import OpenAI
import os
import time
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor
import logging
import re
import json

# Custom Imports
from api.blog.models import Bookmark, Category, Comment, Notification, Post, PostTranslation
from api.blog.serializers import CategorySerializer, CommentSerializer, DashboardSerializer, NotificationSerializer, PostSerializer
from api.core.models import User
from api.core.pagination import CustomPageNumberPagination
from api.core.permissions import IsOwnerOrReadOnly, IsNotGuest, CanCreate, CanEdit, CanDelete, IsAdminOrReadOnly

logger = logging.getLogger(__name__)

# 创建线程池
translator_executor = ThreadPoolExecutor(max_workers=3)

# OpenAI 客户端配置
client = OpenAI(
    api_key=os.environ.get("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com",
    timeout=90.0
)


def clean_translated_content(text):
    """清理翻译结果中的代码块标记"""
    if not text:
        return text

    # 移除 Markdown 代码块标记
    text = re.sub(r'^```(?:json|html|xml)?\s*\n', '', text, flags=re.MULTILINE)
    text = re.sub(r'\n```$', '', text, flags=re.MULTILINE)

    # 移除首尾空白
    text = text.strip()

    return text


def call_openai_translate(text, target_lang, source_lang="zh"):
    """使用 DeepSeek 接口翻译，带超时和重试"""
    if not text or not text.strip():
        return ""

    max_length = 2000
    if len(text) > max_length:
        text = text[:max_length]

    # 优化 prompt，明确要求不要添加代码块
    prompt = f"将以下{source_lang}文本翻译为{target_lang}。注意：\n1. 只返回翻译后的纯文本\n2. 不要添加任何代码块标记（如 ```json 或 ```）\n3. 不要添加任何解释说明\n4. 保持原文格式\n\n原文：\n{text}"

    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model="deepseek-chat",
                messages=[
                    {"role": "system", "content": "你是一个专业翻译助手。只返回翻译结果，不要添加代码块标记或任何其他内容。"},
                    {"role": "user", "content": prompt}
                ],
                timeout=60.0
            )

            result = response.choices[0].message.content.strip()

            # 清理可能的代码块标记
            result = clean_translated_content(result)

            return result

        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep((attempt + 1) * 2)
            else:
                logger.error(
                    f"Translation failed after {max_retries} attempts: {str(e)}")
                raise

    return ""


def translate_rich_text(html, target_lang, source_lang="zh"):
    """翻译 HTML 富文本，分段处理"""
    if not html or not html.strip():
        return ""

    # 尝试解析 JSON 格式的富文本（如 TipTap）
    try:
        json_data = json.loads(html)
        if isinstance(json_data, dict) and json_data.get("type") == "doc":
            return translate_tiptap_json(json_data, target_lang, source_lang)
    except (json.JSONDecodeError, TypeError):
        pass

    # 普通 HTML 翻译
    soup = BeautifulSoup(html, "html.parser")

    text_segments = []
    text_nodes = []

    for tag in soup.find_all(string=True):
        text = tag.strip()
        if text:
            text_segments.append(text)
            text_nodes.append(tag)

    if not text_segments:
        return str(soup)

    try:
        total_length = sum(len(s) for s in text_segments)

        if total_length < 1500:
            # 批量翻译
            combined_text = "\n###SPLIT###\n".join(text_segments)
            prompt = f"将以下{source_lang}文本翻译为{target_lang}。保持 ###SPLIT### 分隔符不变。\n\n{combined_text}"

            response = client.chat.completions.create(
                model="deepseek-chat",
                messages=[
                    {"role": "system", "content": "你是一个专业翻译助手。只返回翻译结果，保持分隔符不变。"},
                    {"role": "user", "content": prompt}
                ],
                timeout=90.0
            )

            result = response.choices[0].message.content.strip()
            result = clean_translated_content(result)

            translated_segments = result.split("\n###SPLIT###\n")

            for i, tag in enumerate(text_nodes):
                if i < len(translated_segments):
                    tag.replace_with(translated_segments[i])

            return str(soup)
        else:
            # 逐段翻译
            for tag in text_nodes:
                try:
                    translated = call_openai_translate(
                        tag.strip(), target_lang, source_lang)
                    tag.replace_with(translated)
                except Exception:
                    continue

            return str(soup)

    except Exception as e:
        logger.error(f"Rich text translation failed: {str(e)}")
        return str(soup)


def translate_tiptap_json(json_data, target_lang, source_lang="zh"):
    """翻译 TipTap JSON 格式的内容"""
    try:
        # 提取所有纯文本内容
        texts = []

        def extract_texts(node):
            if isinstance(node, dict):
                if node.get("type") == "text":
                    text = node.get("text", "").strip()
                    if text:
                        texts.append(text)

                if "content" in node:
                    for child in node["content"]:
                        extract_texts(child)
            elif isinstance(node, list):
                for item in node:
                    extract_texts(item)

        extract_texts(json_data)

        if not texts:
            return json.dumps(json_data, ensure_ascii=False)

        # 批量翻译
        combined_text = "\n###SPLIT###\n".join(texts)
        prompt = f"将以下{source_lang}文本翻译为{target_lang}。保持 ###SPLIT### 分隔符不变。\n\n{combined_text}"

        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "你是一个专业翻译助手。只返回翻译结果，保持分隔符不变。不要添加代码块标记。"},
                {"role": "user", "content": prompt}
            ],
            timeout=90.0
        )

        result = response.choices[0].message.content.strip()
        result = clean_translated_content(result)
        translated_texts = result.split("\n###SPLIT###\n")

        # 替换原文本
        text_index = 0

        def replace_texts(node):
            nonlocal text_index
            if isinstance(node, dict):
                if node.get("type") == "text" and node.get("text", "").strip():
                    if text_index < len(translated_texts):
                        node["text"] = translated_texts[text_index]
                        text_index += 1

                if "content" in node:
                    for child in node["content"]:
                        replace_texts(child)
            elif isinstance(node, list):
                for item in node:
                    replace_texts(item)

        replace_texts(json_data)

        return json.dumps(json_data, ensure_ascii=False)

    except Exception as e:
        logger.error(f"TipTap JSON translation failed: {str(e)}")
        return json.dumps(json_data, ensure_ascii=False)


def translate_post_background(post_id, lang_code, source_lang, source_data):
    """后台翻译任务"""
    try:
        translated_title = call_openai_translate(
            source_data.get("title", ""),
            lang_code,
            source_lang
        )

        translated_description = ""
        if source_data.get("description"):
            translated_description = call_openai_translate(
                source_data["description"],
                lang_code,
                source_lang
            )

        translated_content = ""
        if source_data.get("content"):
            # 检测内容格式
            content = source_data["content"]
            try:
                # 尝试作为 JSON 解析
                json.loads(content)
                translated_content = translate_rich_text(
                    content, lang_code, source_lang)
            except (json.JSONDecodeError, TypeError):
                # 普通 HTML
                translated_content = translate_rich_text(
                    content, lang_code, source_lang)

        post = Post.objects.get(id=post_id)

        PostTranslation.objects.update_or_create(
            post=post,
            language=lang_code,
            defaults={
                'title': translated_title,
                'description': translated_description,
                'content': translated_content,
                'is_ai_generated': True
            }
        )

        return True

    except Exception as e:
        logger.error(
            f"Background translation failed for {lang_code}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False


class CategoryCreateApiView(generics.CreateAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated, CanCreate]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CategoryUpdateAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]

    def get_object(self):
        category_id = self.kwargs['category_id']
        return get_object_or_404(Category, id=category_id)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        posts_count = Post.objects.filter(category=instance).count()
        if posts_count > 0:
            return Response(
                {"error": f"无法删除，该分类下还有 {posts_count} 篇文章。"},
                status=status.HTTP_400_BAD_REQUEST
            )

        self.perform_destroy(instance)
        return Response({"message": "分类已成功删除"}, status=status.HTTP_204_NO_CONTENT)


class CategoryListApiView(generics.ListAPIView):
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Category.objects.all()


class PostCategoryListApiView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        category_slug = self.kwargs['category_slug']
        category = Category.objects.get(slug=category_slug)
        posts = Post.objects.filter(category=category, status='Active')
        return posts


class PostListAPIView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [AllowAny]
    pagination_class = CustomPageNumberPagination

    def get_queryset(self):
        return Post.objects.filter(status='Active')

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        return response


class PostDetailAPIView(generics.RetrieveAPIView):
    serializer_class = PostSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        slug = self.kwargs['slug']
        post = Post.objects.get(slug=slug, status='Active')
        post.views += 1
        post.save()
        return post


class LikePostAPIView(APIView):
    def post(self, request):
        user_id = request.data["user_id"]
        post_id = request.data["post_id"]

        user = User.objects.get(id=user_id)
        post = Post.objects.get(id=post_id)

        if user in post.likes.all():
            post.likes.remove(user)
            return Response({"message": "Post unliked"}, status=status.HTTP_200_OK)
        else:
            post.likes.add(user)
            Notification.objects.create(
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

        post = Post.objects.get(id=post_id)
        Comment.objects.create(
            post=post,
            name=name,
            email=email,
            comment=comment
        )
        Notification.objects.create(
            user=post.user,
            post=post,
            type='Comment',
        )
        return Response({"message": "Comment added"}, status=status.HTTP_201_CREATED)


class BookmarkPostAPIView(APIView):
    def post(self, request):
        user_id = request.data["user_id"]
        post_id = request.data["post_id"]

        user = User.objects.get(id=user_id)
        post = Post.objects.get(id=post_id)

        bookmark = Bookmark.objects.filter(user=user, post=post).first()

        if bookmark:
            bookmark.delete()
            return Response({"message": "Post unbookmarked"}, status=status.HTTP_200_OK)
        else:
            Bookmark.objects.create(user=user, post=post)
            return Response({"message": "Post bookmarked"}, status=status.HTTP_201_CREATED)


class DashboradAPIView(APIView):
    permission_classes = [AllowAny]

    def get_monthly_post_counts(self, user):
        end_date = timezone.now().replace(day=1)
        months = [end_date - relativedelta(months=i)
                  for i in range(11, -1, -1)]
        month_labels = [m.strftime('%Y-%m') for m in months]

        raw_data = (
            Post.objects
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
        user = User.objects.get(id=user_id)

        views = Post.objects.filter(user=user).aggregate(
            view=Sum('views'))["view"] or 0
        posts = Post.objects.filter(user=user).count()
        likes = Post.objects.filter(user=user).aggregate(
            total_likes=Count('likes'))["total_likes"] or 0
        bookmarks = Bookmark.objects.filter(post__user=user).count()

        category_counts = list(Category.objects
                               .all()
                               .annotate(post_count=Count('posts', filter=Q(posts__user=user)))
                               .values('id', 'title', 'slug', 'post_count'))

        monthly_posts = self.get_monthly_post_counts(user)

        popular_posts = list(Post.objects
                             .filter(user=user)
                             .annotate(like_count=Count('likes'))
                             .order_by('-like_count', '-date')[:5]
                             .values('id', 'slug', 'date', 'like_count', 'image'))

        category_likes = list(Category.objects
                              .filter(posts__user=user)
                              .annotate(like_count=Count('posts__likes'))
                              .values('title', 'like_count'))

        one_year_ago = timezone.now() - timedelta(days=365)
        daily_posts = list(
            Post.objects
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
            "comments": 0,
            "bookmarks": bookmarks,
            "categories": category_counts,
            "monthly_posts": monthly_posts,
            "popular_posts": popular_posts,
            "category_likes": category_likes,
            "daily_posts": daily_posts,
        }

        serializer = DashboardSerializer(data)
        return Response(serializer.data)


class DashboardPostLists(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [AllowAny]
    pagination_class = CustomPageNumberPagination

    def get_queryset(self):
        user_id = self.kwargs['user_id']
        user = User.objects.get(id=user_id)
        return Post.objects.filter(user=user).order_by("-id")


class DashboardCommentLists(generics.ListAPIView):
    serializer_class = CommentSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user_id = self.kwargs['user_id']
        user = User.objects.get(id=user_id)
        return Comment.objects.filter(post__user=user).order_by("-id")


class DashboardNotificationsList(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user_id = self.kwargs['user_id']
        user = User.objects.get(id=user_id)
        return Notification.objects.filter(seen=False, user=user)


class DashboardMarkNotificationAsSeen(APIView):
    def post(self, request):
        noti_id = request.data["noti_id"]
        noti = Notification.objects.get(id=noti_id)
        noti.seen = True
        noti.save()
        return Response({"message": "Notification seen"}, status=status.HTTP_200_OK)


class DashboardReplyCommentAPIView(APIView):
    def post(self, request):
        comment_id = request.data["comment_id"]
        reply = request.data["reply"]

        comment = Comment.objects.get(id=comment_id)
        comment.reply = reply
        comment.save()
        return Response({"message": "Reply added"}, status=status.HTTP_200_OK)


class DashboardPostCreateAPIView(generics.CreateAPIView):
    serializer_class = PostSerializer
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_summary="Create a new post",
        request_body=PostSerializer,
        responses={201: "Post created successfully", 400: "Bad request"}
    )
    def create(self, request, *args, **kwargs):
        data = request.data

        user = User.objects.get(id=data["user_id"])
        category = Category.objects.get(id=data["category"])

        post = Post.objects.create(
            user=user,
            image=data.get("image"),
            category=category,
            status=data.get("status", "Active"),
            need_ai_generate=data.get("need_ai_generate", False)
        )

        translations_data = {
            "zh": data.get("zh"),
            "en": data.get("en"),
            "ja": data.get("ja"),
        }
        need_ai_generate = data.get("need_ai_generate", False)

        available_langs = {
            k: v for k, v in translations_data.items() if v and v.get("title")}

        for lang_code in ["zh", "en", "ja"]:
            translation = translations_data.get(lang_code)

            if translation and translation.get("title"):
                PostTranslation.objects.create(
                    post=post,
                    language=lang_code,
                    title=translation.get("title"),
                    description=translation.get("description"),
                    content=translation.get("content"),
                    is_ai_generated=translation.get("is_ai_generated", False)
                )
            else:
                if not available_langs or not need_ai_generate:
                    continue

                source_lang, source_data = list(available_langs.items())[0]

                try:
                    translated_title = call_openai_translate(
                        source_data["title"], lang_code, source_lang)
                    translated_description = call_openai_translate(
                        source_data["description"], lang_code, source_lang)
                    translated_content = translate_rich_text(
                        source_data["content"], lang_code, source_lang)

                    PostTranslation.objects.create(
                        post=post,
                        language=lang_code,
                        title=translated_title,
                        description=translated_description,
                        content=translated_content,
                        is_ai_generated=True
                    )
                except Exception as e:
                    logger.error(
                        f"Translation failed for {lang_code}: {str(e)}")
                    return Response(
                        {"error": f"翻译失败: {lang_code} - {str(e)}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

        return Response({
            "message": "Post created with translations",
            "post": {
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
            }
        }, status=status.HTTP_201_CREATED)


class DashboardPostUpdateAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PostSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        user_id = self.kwargs['user_id']
        post_id = self.kwargs['post_id']
        user = User.objects.get(id=user_id)
        post = Post.objects.get(id=post_id, user=user)
        return post

    def update(self, request, *args, **kwargs):
        data = request.data
        post_instance = self.get_object()
        updated = False

        image = data.get("image")
        category_id = data.get("category")
        status_value = data.get("status")
        need_ai_generate = data.get("need_ai_generate")

        if image and image != 'undefined' and image != post_instance.image:
            post_instance.image = image
            updated = True

        if category_id:
            category = Category.objects.get(id=category_id)
            if post_instance.category != category:
                post_instance.category = category
                updated = True

        if status_value and status_value != post_instance.status:
            post_instance.status = status_value
            updated = True

        if need_ai_generate is not None and post_instance.need_ai_generate != need_ai_generate:
            post_instance.need_ai_generate = need_ai_generate
            updated = True

        if updated:
            post_instance.save()

        translations_data = {
            "zh": data.get("zh"),
            "en": data.get("en"),
            "ja": data.get("ja"),
        }

        translations_updated = False
        background_tasks = []

        available_langs = {}
        for lang_code, translation in translations_data.items():
            if translation and translation.get("title"):
                available_langs[lang_code] = translation

        for lang_code in ["zh", "en", "ja"]:
            translation = translations_data.get(lang_code)

            if translation and translation.get("title"):
                try:
                    post_translation, created = PostTranslation.objects.get_or_create(
                        post=post_instance,
                        language=lang_code,
                        defaults={
                            'title': translation.get("title", ""),
                            'description': translation.get("description", ""),
                            'content': translation.get("content", ""),
                            'is_ai_generated': translation.get("is_ai_generated", False)
                        }
                    )

                    if not created:
                        changed = False
                        for field in ["title", "description", "content"]:
                            new_val = translation.get(field, "")
                            old_val = getattr(post_translation, field) or ""
                            if new_val != old_val:
                                setattr(post_translation, field, new_val)
                                changed = True

                        if changed:
                            post_translation.is_ai_generated = translation.get(
                                "is_ai_generated", False)
                            post_translation.save()
                            translations_updated = True
                    else:
                        translations_updated = True

                except Exception as e:
                    logger.error(
                        f"Failed to save {lang_code} translation: {str(e)}")
                    continue

            elif need_ai_generate and available_langs:
                try:
                    existing = PostTranslation.objects.filter(
                        post=post_instance,
                        language=lang_code
                    ).first()

                    if existing and existing.title:
                        continue

                    source_lang = None
                    source_data = None

                    for preferred_lang in ["zh", "ja", "en"]:
                        if preferred_lang != lang_code and preferred_lang in available_langs:
                            source_lang = preferred_lang
                            source_data = available_langs[preferred_lang]
                            break

                    if not source_data:
                        continue

                    # 使用后台线程执行翻译
                    future = translator_executor.submit(
                        translate_post_background,
                        post_instance.id,
                        lang_code,
                        source_lang,
                        source_data
                    )
                    background_tasks.append(future)
                    translations_updated = True

                except Exception as e:
                    logger.error(
                        f"Failed to submit translation task for {lang_code}: {str(e)}")
                    continue

        message = "Post updated successfully"
        if background_tasks:
            message += f". AI translation in progress for {len(background_tasks)} language(s)."

        if updated or translations_updated:
            serializer = self.get_serializer(post_instance)
            return Response({
                "message": message,
                "data": serializer.data,
                "translating": len(background_tasks) > 0
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                "message": "No changes detected"
            }, status=status.HTTP_200_OK)


class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    permission_classes = [AllowAny]
    pagination_class = CustomPageNumberPagination

    def get_queryset(self):
        return Post.objects.filter(status='Active')

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        elif self.action == 'create':
            permission_classes = [IsAuthenticated, CanCreate]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [IsAuthenticated, CanEdit]
        elif self.action == 'destroy':
            permission_classes = [IsAuthenticated, CanDelete]
        else:
            permission_classes = [IsAuthenticated, IsNotGuest]

        return [permission() for permission in permission_classes]
