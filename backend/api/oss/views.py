import json
import os
from django.http import JsonResponse
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from api.core.permissions import CanDelete, IsAdminOrReadOnly
from aliyunsdkcore.client import AcsClient
from aliyunsdksts.request.v20150401 import AssumeRoleRequest
from aliyunsdkcore.profile import region_provider
from api.oss.utils import (
    upload_file_to_oss,
    delete_file_from_oss,
    delete_files_from_oss_batch,
    list_files_from_oss
)

region_provider.modify_point('Sts', 'cn-hangzhou', 'sts.aliyuncs.com')


class OSSCredentialsView(APIView):
    permission_classes = []

    def get(self, request):
        access_key_id = os.getenv('ALIYUN_OSS_ACCESS_KEY_ID')
        access_key_secret = os.getenv('ALIYUN_OSS_ACCESS_KEY_SECRET')
        role_arn = os.getenv('OSS_ROLE_ARN')
        bucket_name = os.getenv('OSS_BUCKET')

        try:
            client = AcsClient(
                access_key_id,
                access_key_secret,
                'cn-shanghai',
                timeout=20
            )

            request_obj = AssumeRoleRequest.AssumeRoleRequest()
            request_obj.set_RoleArn(role_arn)
            request_obj.set_RoleSessionName('django-oss-upload')
            request_obj.set_DurationSeconds(900)

            policy = {
                "Statement": [{
                    "Effect": "Allow",
                    "Action": ["oss:PutObject", "oss:GetObject"],
                    "Resource": [f"acs:oss:*:*:{bucket_name}/uploads/*"]
                }],
                "Version": "1"
            }
            request_obj.set_Policy(json.dumps(policy))

            response = client.do_action_with_exception(request_obj)
            result = json.loads(response)

            return Response({
                'StatusCode': 200,
                'AccessKeyId': result['Credentials']['AccessKeyId'],
                'AccessKeySecret': result['Credentials']['AccessKeySecret'],
                'SecurityToken': result['Credentials']['SecurityToken'],
                'Expiration': result['Credentials']['Expiration'],
                'Region': os.getenv('OSS_REGION'),
                'Bucket': bucket_name
            })

        except Exception as e:
            print(f"[ERROR] STS Request Failed: {str(e)}")
            return Response(
                {'error': 'STS Credential Generation Failed',
                    'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class OSSImageUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]

    def post(self, request):
        try:
            if 'file' not in request.FILES:
                return Response(
                    {'error': 'No file provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            file = request.FILES['file']
            directory = request.POST.get('directory', 'uploads')

            result = upload_file_to_oss(file, directory)

            return Response({
                'success': True,
                'message': 'File uploaded successfully',
                'data': result
            }, status=status.HTTP_201_CREATED)

        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            print(f"[ERROR] Upload Failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': 'OSS Upload Failed', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class OSSImageListView(APIView):
    permission_classes = []

    def get(self, request):
        try:
            page = int(request.GET.get('page', 1))
            page_size = int(request.GET.get('page_size', 50))
            directory = request.GET.get('directory', '')
            search = request.GET.get('search', '')

            if directory and not directory.endswith('/'):
                directory += '/'
            prefix = directory if directory else request.GET.get(
                'prefix', 'uploads/')

            result = list_files_from_oss(
                prefix=prefix,
                search=search,
                page=page,
                page_size=page_size,
                image_only=True
            )

            return Response({
                'count': result['count'],
                'results': result['results'],
                'page': result['page'],
                'page_size': result['pageSize'],
                'total_pages': result['totalPages'],
                'prefix': result['prefix'],
            })

        except Exception as e:
            print(f"[ERROR] List Failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': 'OSS List Failed', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class OSSImageDeleteView(APIView):
    permission_classes = [IsAuthenticated, CanDelete]

    def delete(self, request):
        try:
            object_key = request.data.get('object_key')

            if not object_key:
                return Response(
                    {'error': 'object_key is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            success = delete_file_from_oss(object_key)

            if success:
                return Response({
                    'message': 'Image deleted successfully',
                    'object_key': object_key
                })
            else:
                return Response({
                    'error': 'Delete operation failed',
                    'object_key': object_key
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            print(f"[ERROR] Delete Failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': 'OSS Delete Failed', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class OSSImageBatchDeleteView(APIView):
    permission_classes = [IsAuthenticated, CanDelete]

    def delete(self, request):
        try:
            object_keys = request.data.get('object_keys', [])

            result = delete_files_from_oss_batch(object_keys)

            response_status = status.HTTP_200_OK if result[
                'total_failed'] == 0 else status.HTTP_207_MULTI_STATUS

            return Response({
                'message': f"Deleted {result['total_deleted']} images",
                **result
            }, status=response_status)

        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            print(f"[ERROR] Batch Delete Failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': 'OSS Batch Delete Failed', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
