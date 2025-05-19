from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers

from api import models as api_models


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['full_name'] = user.full_name
        token['email'] = user.email
        token['username'] = user.username
        return token


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password])
    confirm_password = serializers.CharField(
        write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = api_models.User
        fields = ['username', 'email',
                  'password', 'confirm_password']

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        email_username = validated_data['email'].split('@')[0]
        username = validated_data.get('username', None)
        full_name = validated_data.get('full_name', None)

        user = api_models.User(
            email=validated_data['email'],
            full_name=full_name if full_name else email_username,
            username=username,
        )
        user.set_password(validated_data['password'])
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = api_models.User
        fields = fields = ['id', 'username', 'email']


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    is_superuser = serializers.SerializerMethodField()

    class Meta:
        model = api_models.Profile
        fields = "__all__"
        read_only_fields = ('user',)

    def get_is_superuser(self, obj):
        return obj.user.is_superuser


class CategorySerializer(serializers.ModelSerializer):
    post_count = serializers.SerializerMethodField()
    user = UserSerializer(read_only=True)

    class Meta:
        model = api_models.Category
        fields = ["id", "title", "image", "slug",
                  "post_count", "user"]  # 添加 user 到字段列表

    def get_post_count(self, category):
        return category.posts.count() if hasattr(category, 'posts') else 0

    def validate_slug(self, value):
        if api_models.Category.objects.filter(slug=value).exists():
            raise serializers.ValidationError("Slug must be unique.")
        return value


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = api_models.Comment
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super(CommentSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method == 'POST':
            self.Meta.depth = 0
        else:
            self.Meta.depth = 1


class PostTranslationSerializer(serializers.ModelSerializer):
    class Meta:
        model = api_models.PostTranslation
        fields = ['id', 'language', 'title',
                  'description', 'content', 'is_ai_generated']


class PostSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    profile = ProfileSerializer(read_only=True)
    translations = serializers.SerializerMethodField()

    class Meta:
        model = api_models.Post
        fields = [
            'id', 'user', 'profile', 'image', 'slug', 'category',
            'status', 'views', 'likes', 'date', 'translations'
        ]

    def get_translations(self, obj):
        # 返回以语言为key的对象
        return {
            t.language: {
                "title": t.title,
                "description": t.description,
                "content": t.content,
                "is_ai_generated": t.is_ai_generated,
            } for t in obj.translations.all()
        }

    def __init__(self, *args, **kwargs):
        super(PostSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method == 'POST':
            self.Meta.depth = 0
        else:
            self.Meta.depth = 1


class BookmarkSerializer(serializers.ModelSerializer):
    class Meta:
        model = api_models.Bookmark
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super(BookmarkSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method == 'POST':
            self.Meta.depth = 0
        else:
            self.Meta.depth = 1


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = api_models.Notification
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super(NotificationSerializer, self).__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.method == 'POST':
            self.Meta.depth = 0
        else:
            self.Meta.depth = 1


class AuthorSerializer(serializers.Serializer):
    views = serializers.IntegerField(default=0)
    posts = serializers.IntegerField(default=0)
    likes = serializers.IntegerField(default=0)
    comments = serializers.IntegerField(default=0)
    bookmarks = serializers.IntegerField(default=0)


class CategoryCountSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    slug = serializers.CharField()
    post_count = serializers.IntegerField()


class MonthlyPostSerializer(serializers.Serializer):
    month = serializers.DateTimeField()
    count = serializers.IntegerField()


class DailyPostSerializer(serializers.Serializer):
    day = serializers.DateTimeField()
    count = serializers.IntegerField()


class PopularPostSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    slug = serializers.CharField()
    date = serializers.DateTimeField()
    like_count = serializers.IntegerField()
    image = serializers.CharField()


class CategoryLikeSerializer(serializers.Serializer):
    title = serializers.CharField()
    like_count = serializers.IntegerField()


class DashboardSerializer(serializers.Serializer):
    views = serializers.IntegerField(default=0)
    posts = serializers.IntegerField(default=0)
    likes = serializers.IntegerField(default=0)
    comments = serializers.IntegerField(default=0)
    bookmarks = serializers.IntegerField(default=0)
    categories = CategoryCountSerializer(many=True)
    monthly_posts = MonthlyPostSerializer(many=True)
    popular_posts = PopularPostSerializer(many=True)
    category_likes = CategoryLikeSerializer(many=True)
    daily_posts = DailyPostSerializer(many=True)
