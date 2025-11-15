from rest_framework import serializers
import re


class ContactSerializer(serializers.Serializer):
    name = serializers.CharField(
        max_length=100,
        required=True,
        error_messages={
            'required': 'Name is required',
            'max_length': 'Name cannot exceed 100 characters'
        }
    )
    email = serializers.EmailField(
        required=True,
        error_messages={
            'required': 'Email is required',
            'invalid': 'Please enter a valid email address'
        }
    )
    phone = serializers.CharField(
        max_length=20,
        required=False,
        allow_blank=True
    )
    message = serializers.CharField(
        max_length=5000,
        required=True,
        error_messages={
            'required': 'Message is required',
            'max_length': 'Message cannot exceed 5000 characters'
        }
    )

    def validate_name(self, value):
        """验证姓名"""
        if len(value.strip()) < 2:
            raise serializers.ValidationError(
                "Name must be at least 2 characters long"
            )
        return value.strip()

    def validate_phone(self, value):
        """验证电话号码（可选）"""
        if value:
            # 移除所有空格和特殊字符
            cleaned = re.sub(r'[\s\-\(\)]', '', value)
            # 验证是否为有效的电话号码格式（支持国际格式）
            if not re.match(r'^\+?[0-9]{8,15}$', cleaned):
                raise serializers.ValidationError(
                    "Please enter a valid phone number"
                )
        return value

    def validate_message(self, value):
        """验证消息内容"""
        if len(value.strip()) < 10:
            raise serializers.ValidationError(
                "Message must be at least 10 characters long"
            )
        return value.strip()
