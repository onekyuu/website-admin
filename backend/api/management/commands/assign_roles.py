from django.core.management.base import BaseCommand
from api.core.models import Role, Profile, User


class Command(BaseCommand):
    help = '为指定用户设置角色'

    def add_arguments(self, parser):
        parser.add_argument(
            'username',
            type=str,
            help='用户名'
        )
        parser.add_argument(
            'role',
            type=str,
            choices=['admin', 'editor', 'author', 'guest'],
            help='角色名称 (admin/editor/author/guest)'
        )

    def handle(self, *args, **options):
        username = options['username']
        role_name = options['role']

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'用户 "{username}" 不存在！')
            )
            return

        try:
            role = Role.objects.get(name=role_name)
        except Role.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'角色 "{role_name}" 不存在！')
            )
            self.stdout.write(
                self.style.WARNING('请先运行: python manage.py init_roles')
            )
            return

        # 设置角色
        user.profile.role = role
        user.profile.save()

        self.stdout.write(
            self.style.SUCCESS(
                f'✓ 成功将用户 "{username}" 的角色设置为 "{role.display_name}"'
            )
        )

        # 显示权限
        self.stdout.write('\n权限详情：')
        self.stdout.write(f'  - 可以创建: {user.profile.can_create}')
        self.stdout.write(f'  - 可以编辑: {user.profile.can_edit}')
        self.stdout.write(f'  - 可以删除: {user.profile.can_delete}')
        self.stdout.write(f'  - 可以发布: {user.profile.can_publish}')
        self.stdout.write(f'  - 可以管理用户: {user.profile.can_manage_users}')
