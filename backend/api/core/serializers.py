from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from api.core.models import User, Profile, Role
from api.core.utils import get_file_url


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['full_name'] = user.full_name
        token['email'] = user.email
        token['username'] = user.username
        return token


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['full_name', 'email', 'password', 'password2']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create(
            full_name=validated_data['full_name'],
            email=validated_data['email']
        )
        user.set_password(validated_data['password'])
        user.save()
        return user


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = [
            'id', 'name', 'display_name', 'description',
            'can_create', 'can_edit', 'can_delete',
            'can_publish', 'can_manage_users'
        ]
        read_only_fields = ['id']


class ProfileSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)
    role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        source='role',
        write_only=True,
        required=False
    )
    permissions = serializers.SerializerMethodField()
    role_name = serializers.CharField(source='role.name', read_only=True)

    class Meta:
        model = Profile
        fields = [
            'id', 'user', 'role', 'role_id', 'role_name', 'avatar',
            'full_name', 'bio', 'about', 'author',
            'country', 'facebook', 'permissions'
        ]
        read_only_fields = ['id', 'user']

    def get_permissions(self, obj):
        return {
            'can_create': obj.can_create,
            'can_edit': obj.can_edit,
            'can_delete': obj.can_delete,
            'can_publish': obj.can_publish,
            'can_manage_users': obj.can_manage_users,
            'is_guest': obj.is_guest,
            'is_admin': obj.is_admin,
        }


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'profile']
        read_only_fields = ['id']
