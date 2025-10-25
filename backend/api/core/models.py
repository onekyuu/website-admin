from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save


class User(AbstractUser):
    username = models.CharField(unique=True, max_length=100)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=100)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'api_user'

    def __str__(self):
        return self.username

    def save(self, *args, **kwargs):
        email_username = self.email.split('@')[0]
        if self.full_name == "" or self.full_name is None:
            self.full_name = email_username
        if self.username == "" or self.username is None:
            self.username = email_username
        super(User, self).save(*args, **kwargs)


class Role(models.Model):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('editor', 'Editor'),
        ('author', 'Author'),
        ('guest', 'Guest'),
    ]

    name = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        unique=True,
        verbose_name='role_name'
    )
    display_name = models.CharField(
        max_length=50,
        verbose_name='role_display_name'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='role_description'
    )

    # 权限标志
    can_create = models.BooleanField(default=True, verbose_name='can_create')
    can_edit = models.BooleanField(default=True, verbose_name='can_edit')
    can_delete = models.BooleanField(default=True, verbose_name='can_delete')
    can_publish = models.BooleanField(default=True, verbose_name='can_publish')
    can_manage_users = models.BooleanField(
        default=False, verbose_name='can_manage_users')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'api_role'
        verbose_name = 'role'
        verbose_name_plural = 'roles'

    def __str__(self) -> str:
        if self.display_name:
            return str(self.display_name)
        elif self.name:
            return str(self.name)
        else:
            return 'Role'


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.ForeignKey(
        Role,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='profiles',
        verbose_name='用户角色'
    )
    avatar = models.URLField(
        max_length=500,
        default="default/default-user.jpg",
        null=True,
        blank=True
    )
    full_name = models.CharField(max_length=100, null=True, blank=True)
    bio = models.CharField(max_length=500, null=True, blank=True)
    about = models.TextField(null=True, blank=True)
    author = models.BooleanField(default=False)
    country = models.CharField(max_length=100, null=True, blank=True)
    date = models.DateTimeField(auto_now_add=True)
    facebook = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        db_table = 'api_profile'

    def __str__(self):
        return self.user.username

    def save(self, *args, **kwargs):
        if self.full_name == "" or self.full_name is None:
            self.full_name = self.user.full_name

        # 如果没有设置角色，默认设置为 author
        if not self.role:
            author_role, _ = Role.objects.get_or_create(
                name='author',
                defaults={
                    'display_name': 'Author',
                    'description': 'Can create and edit own content',
                    'can_create': True,
                    'can_edit': True,
                    'can_delete': False,
                    'can_publish': False,
                    'can_manage_users': False,
                }
            )
            self.role = author_role

        super(Profile, self).save(*args, **kwargs)

    @property
    def can_create(self):
        """是否可以创建内容"""
        return self.role.can_create if self.role else False

    @property
    def can_edit(self):
        """是否可以编辑内容"""
        return self.role.can_edit if self.role else False

    @property
    def can_delete(self):
        """是否可以删除内容"""
        return self.role.can_delete if self.role else False

    @property
    def can_publish(self):
        """是否可以发布内容"""
        return self.role.can_publish if self.role else False

    @property
    def can_manage_users(self):
        """是否可以管理用户"""
        return self.role.can_manage_users if self.role else False

    @property
    def is_guest(self):
        """是否是访客"""
        return self.role and self.role.name == 'guest'

    @property
    def is_admin(self):
        """是否是管理员"""
        return self.role and self.role.name == 'admin'

    @property
    def role_name(self):
        """获取角色名称"""
        return self.role.name if self.role else None


def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)


def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()


post_save.connect(create_user_profile, sender=User)
post_save.connect(save_user_profile, sender=User)
