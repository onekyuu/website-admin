from django.core.management.base import BaseCommand
from api.core.models import Role


class Command(BaseCommand):
    help = '初始化系统角色'

    def handle(self, *args, **options):
        roles_data = [
            {
                'name': 'admin',
                'display_name': 'Administrator',
                'description': 'Full access to all features',
                'can_create': True,
                'can_edit': True,
                'can_delete': True,
                'can_publish': True,
                'can_manage_users': True,
            },
            {
                'name': 'editor',
                'display_name': 'Editor',
                'description': 'Can create, edit and delete content',
                'can_create': True,
                'can_edit': True,
                'can_delete': True,
                'can_publish': True,
                'can_manage_users': False,
            },
            {
                'name': 'author',
                'display_name': 'Author',
                'description': 'Can create and edit own content',
                'can_create': True,
                'can_edit': True,
                'can_delete': False,
                'can_publish': False,
                'can_manage_users': False,
            },
            {
                'name': 'guest',
                'display_name': 'Guest',
                'description': 'Read-only access',
                'can_create': False,
                'can_edit': False,
                'can_delete': False,
                'can_publish': False,
                'can_manage_users': False,
            },
        ]

        for role_data in roles_data:
            role, created = Role.objects.get_or_create(
                name=role_data['name'],
                defaults=role_data
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully created role: {role.display_name}')
                )
            else:
                # 更新现有角色的权限
                for key, value in role_data.items():
                    if key != 'name':
                        setattr(role, key, value)
                role.save()
                self.stdout.write(
                    self.style.WARNING(f'Updated role: {role.display_name}')
                )

        self.stdout.write(self.style.SUCCESS(
            'Roles initialization completed!'))
