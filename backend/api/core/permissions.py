from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied


class IsNotGuest(permissions.BasePermission):
    """
    非访客权限：访客用户不能执行创建、更新、删除操作
    """
    message = "Guest users have read-only access."

    def has_permission(self, request, view):
        # 允许所有 GET, HEAD, OPTIONS 请求（只读操作）
        if request.method in permissions.SAFE_METHODS:
            return True

        # 检查用户是否认证
        if not request.user or not request.user.is_authenticated:
            return False

        # 检查用户是否是访客
        try:
            profile = request.user.profile
            if profile.is_guest:
                return False
            return True
        except:
            return False


class CanCreate(permissions.BasePermission):
    """
    可以创建内容的权限
    """
    message = "You don't have permission to create content."

    def has_permission(self, request, view):
        if request.method != 'POST':
            return True

        if not request.user or not request.user.is_authenticated:
            return False

        try:
            return request.user.profile.can_create
        except:
            return False


class CanEdit(permissions.BasePermission):
    """
    可以编辑内容的权限
    """
    message = "You don't have permission to edit content."

    def has_permission(self, request, view):
        if request.method not in ['PUT', 'PATCH']:
            return True

        if not request.user or not request.user.is_authenticated:
            return False

        try:
            return request.user.profile.can_edit
        except:
            return False


class CanDelete(permissions.BasePermission):
    """
    可以删除内容的权限
    """
    message = "You don't have permission to delete content."

    def has_permission(self, request, view):
        if request.method != 'DELETE':
            return True

        if not request.user or not request.user.is_authenticated:
            return False

        try:
            return request.user.profile.can_delete
        except:
            return False


class CanManageUsers(permissions.BasePermission):
    """
    可以管理用户的权限
    """
    message = "You don't have permission to manage users."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        try:
            return request.user.profile.can_manage_users or request.user.is_superuser
        except:
            return False


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    对象所有者可以编辑，其他人只读
    """
    message = "You can only edit your own content."

    def has_object_permission(self, request, view, obj):
        # 允许所有只读请求
        if request.method in permissions.SAFE_METHODS:
            return True

        # 检查是否是管理员
        if request.user.is_superuser:
            return True

        try:
            if request.user.profile.is_admin:
                return True
        except:
            pass

        # 检查是否是所有者
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'author'):
            return obj.author == request.user

        return False


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    管理员可以修改，其他人只读
    """
    message = "Only administrators can modify this resource."

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        if not request.user or not request.user.is_authenticated:
            return False

        try:
            return request.user.profile.is_admin or request.user.is_superuser
        except:
            return False
