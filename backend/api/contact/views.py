from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.throttling import AnonRateThrottle
from django.core.mail import EmailMessage
from django.conf import settings
from django.template.loader import render_to_string
from api.contact.serializers import ContactSerializer
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class ContactRateThrottle(AnonRateThrottle):
    rate = '5/hour'  # 每小时最多5次


class ContactView(APIView):
    """
    联系表单视图 - 发送邮件
    """
    permission_classes = [AllowAny]
    throttle_classes = [ContactRateThrottle]

    def post(self, request):
        serializer = ContactSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {
                    'success': False,
                    'errors': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # 获取验证后的数据
        validated_data = serializer.validated_data
        name = validated_data['name']
        email = validated_data['email']
        phone = validated_data.get('phone', '')
        message = validated_data['message']

        try:
            # 构建邮件内容
            subject = f"New Contact Form Submission from {name}"

            # HTML 邮件模板
            html_message = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }}
                    .header {{
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 20px;
                        border-radius: 8px 8px 0 0;
                        text-align: center;
                    }}
                    .content {{
                        background: #f9f9f9;
                        padding: 30px;
                        border: 1px solid #e0e0e0;
                        border-radius: 0 0 8px 8px;
                    }}
                    .field {{
                        margin-bottom: 20px;
                    }}
                    .field-label {{
                        font-weight: bold;
                        color: #667eea;
                        margin-bottom: 5px;
                    }}
                    .field-value {{
                        background: white;
                        padding: 12px;
                        border-left: 4px solid #667eea;
                        border-radius: 4px;
                    }}
                    .message-box {{
                        background: white;
                        padding: 20px;
                        border-radius: 4px;
                        border: 1px solid #e0e0e0;
                        white-space: pre-wrap;
                        word-wrap: break-word;
                    }}
                    .footer {{
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #e0e0e0;
                        text-align: center;
                        color: #999;
                        font-size: 12px;
                    }}
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>📬 New Contact Message</h1>
                </div>
                <div class="content">
                    <div class="field">
                        <div class="field-label">👤 Name:</div>
                        <div class="field-value">{name}</div>
                    </div>
                    
                    <div class="field">
                        <div class="field-label">📧 Email:</div>
                        <div class="field-value">
                            <a href="mailto:{email}" style="color: #667eea; text-decoration: none;">
                                {email}
                            </a>
                        </div>
                    </div>
                    
                    {f'''
                    <div class="field">
                        <div class="field-label">📱 Phone:</div>
                        <div class="field-value">{phone}</div>
                    </div>
                    ''' if phone else ''}
                    
                    <div class="field">
                        <div class="field-label">💬 Message:</div>
                        <div class="message-box">{message}</div>
                    </div>
                    
                    <div class="footer">
                        <p>Received at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                        <p>This message was sent from your website contact form</p>
                    </div>
                </div>
            </body>
            </html>
            """

            # 纯文本版本（作为后备）
            text_message = f"""
New Contact Form Submission

Name: {name}
Email: {email}
{f'Phone: {phone}' if phone else ''}

Message:
{message}

---
Received at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            """

            # 发送邮件
            email_message = EmailMessage(
                subject=subject,
                body=text_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[settings.CONTACT_EMAIL_RECIPIENT],
                reply_to=[email],  # 设置回复地址为发送者邮箱
            )

            # 添加 HTML 内容
            email_message.content_subtype = "html"
            email_message.body = html_message

            # 发送邮件
            email_message.send(fail_silently=False)

            logger.info(f"Contact form submitted successfully by {email}")

            return Response(
                {
                    'success': True,
                    'message': 'Your message has been sent successfully! We will get back to you soon.'
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            logger.error(f"Failed to send contact email: {str(e)}")
            return Response(
                {
                    'success': False,
                    'message': 'Failed to send message. Please try again later or contact us directly.'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
