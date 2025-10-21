from rest_framework import serializers
from api.blog.models import Category, Post, PostTranslation, Comment, Bookmark, Notification
from api.core.serializers import UserSerializer, ProfileSerializer
from api.core.utils import get_file_url


class CategorySerializer(serializers.ModelSerializer):
    post_count = serializers.SerializerMethodField()
    user = UserSerializer(read_only=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "title", "image", "slug", "post_count", "user"]

    def get_post_count(self, category):
        return category.posts.count()

    def get_image(self, obj):
        return get_file_url(obj, 'image', self.context.get('request'))

    def validate_slug(self, value):
        if Category.objects.filter(slug=value).exists():
            raise serializers.ValidationError("Slug must be unique.")
        return value


class PostSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    profile = serializers.SerializerMethodField()
    category = serializers.SerializerMethodField()
    translations = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'user', 'profile', 'image', 'slug', 'category',
            'status', 'views', 'likes', 'date', 'translations'
        ]

    def get_user(self, obj):
        return UserSerializer(obj.user, context=self.context).data

    def get_profile(self, obj):
        if obj.profile:
            return ProfileSerializer(obj.profile, context=self.context).data
        return None

    def get_category(self, obj):
        if obj.category:
            return CategorySerializer(obj.category, context=self.context).data
        return None

    def get_image(self, obj):
        return get_file_url(obj, 'image', self.context.get('request'))

    def get_translations(self, obj):
        return {
            t.language: {
                "title": t.title,
                "description": t.description,
                "content": t.content,
                "is_ai_generated": t.is_ai_generated,
            } for t in obj.translations.all()
        }


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = "__all__"


class BookmarkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bookmark
        fields = "__all__"


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"


class DashboardSerializer(serializers.Serializer):
    views = serializers.IntegerField()
    posts = serializers.IntegerField()
    likes = serializers.IntegerField()
    comments = serializers.IntegerField()
    bookmarks = serializers.IntegerField()
    categories = serializers.ListField()
    monthly_posts = serializers.ListField()
    popular_posts = serializers.ListField()
    category_likes = serializers.ListField()
    daily_posts = serializers.ListField()