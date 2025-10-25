from django.contrib import admin
from api.core.models import Role, Profile, User

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['display_name', 'name', 'can_create', 'can_edit', 'can_delete', 'can_publish', 'can_manage_users']
    list_filter = ['name']
    search_fields = ['name', 'display_name']

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'full_name', 'author', 'country']
    list_filter = ['role', 'author']
    search_fields = ['user__username', 'user__email', 'full_name']
    raw_id_fields = ['user']