import json
import os
from urllib.parse import urlencode

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from api.core.permissions import CanDelete
from aliyunsdkcore.client import AcsClient
from aliyunsdksts.request.v20150401 import AssumeRoleRequest
from aliyunsdkcore.profile import region_provider

import alibabacloud_oss_v2 as oss
from alibabacloud_oss_v2.models import ListObjectsV2Request, DeleteObjectRequest


region_provider.modify_point('Sts', 'cn-hangzhou', 'sts.aliyuncs.com')


def get_oss_credentials(request):
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

        request = AssumeRoleRequest.AssumeRoleRequest()
        request.set_RoleArn(role_arn)
        request.set_RoleSessionName('django-oss-upload')
        request.set_DurationSeconds(900)

        policy = {
            "Statement": [{
                "Effect": "Allow",
                "Action": ["oss:PutObject", "oss:GetObject"],
                "Resource": [f"acs:oss:*:*:{bucket_name}/uploads/*"]
            }],
            "Version": "1"
        }
        request.set_Policy(json.dumps(policy))

        response = client.do_action_with_exception(request)
        result = json.loads(response)
        return JsonResponse({
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
        return JsonResponse(
            {'error': 'STS Credential Generation Failed', 'detail': str(e)},
            status=500
        )


def list_oss_images(request):
    bucket_name = os.getenv('OSS_BUCKET')
    region = os.getenv('OSS_REGION')
    endpoint = f"https://{region}.aliyuncs.com"

    # 获取分页参数
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 50))
    prefix = request.GET.get('prefix', 'uploads/')
    search = request.GET.get('search', '')

    credentials_provider = oss.credentials.EnvironmentVariableCredentialsProvider()

    cfg = oss.config.load_default()
    cfg.credentials_provider = credentials_provider
    cfg.region = 'cn-shanghai'
    cfg.endpoint = endpoint

    client = oss.Client(cfg)

    try:
        req = ListObjectsV2Request(
            bucket=bucket_name,
            prefix=prefix,
            max_keys=100,
        )

        paginator = client.list_objects_v2_paginator()

        all_images = []
        image_extensions = ['.jpg', '.jpeg', '.png',
                            '.gif', '.webp', '.svg', '.bmp', '.ico']

        # 遍历对象列表的每一页
        for page_result in paginator.iter_page(req):
            if page_result.contents:
                for obj in page_result.contents:
                    # 只处理文件（不是目录）
                    if not obj.key.endswith('/'):
                        # 检查是否是图片文件
                        if any(obj.key.lower().endswith(ext) for ext in image_extensions):
                            # 如果有搜索词，进行过滤
                            if search and search not in obj.key.lower():
                                continue

                            path_parts = obj.key.split('/')

                            # 移除前缀和文件名，获取中间的目录部分
                            if len(path_parts) > 2:
                                # 如果有多级目录，取除了 prefix 和文件名外的所有部分
                                directory = '/'.join(path_parts[1:-1])
                                # 取最后一级目录作为显示名称
                                directory_name = path_parts[-2]
                            elif len(path_parts) == 2:
                                # 直接在 uploads 下
                                directory = ''
                                directory_name = 'uploads'
                            else:
                                directory = ''
                                directory_name = ''

                            all_images.append({
                                'name': obj.key,
                                'url': f"https://{bucket_name}.{region}.aliyuncs.com/{obj.key}",
                                'size': obj.size,
                                'lastModified': obj.last_modified.isoformat() if obj.last_modified else None,
                                'etag': obj.etag,
                                'directory': directory,  # 完整目录路径（不含 uploads/ 前缀）
                                'directoryName': directory_name,  # 所在目录名称
                                'fileName': path_parts[-1],
                            })
                # 按最后修改时间倒序排序
        all_images.sort(key=lambda x: x['lastModified'] or '', reverse=True)

        # 手动分页
        total_count = len(all_images)
        start_index = (page - 1) * page_size
        end_index = start_index + page_size

        paginated_images = all_images[start_index:end_index]

        # 计算分页信息
        has_next = end_index < total_count
        has_previous = page > 1

        base_url = request.build_absolute_uri(request.path)

        def build_page_url(page_num):
            params = {
                'page': page_num,
                'page_size': page_size,
                'prefix': prefix,
            }
            if search:
                params['search'] = search
            return f"{base_url}?{urlencode(params)}"

        next_url = build_page_url(page + 1) if has_next else None
        previous_url = build_page_url(page - 1) if has_previous else None

        return JsonResponse({
            'count': total_count,
            'next': next_url,
            'previous': previous_url,
            'results': paginated_images,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size,
        })

    except Exception as e:
        print(f"[ERROR] OSS List Request Failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return JsonResponse(
            {'error': 'OSS List Failed', 'detail': str(e)},
            status=500
        )


@csrf_exempt
@api_view(['DELETE'])
@permission_classes([IsAuthenticated, CanDelete])
def delete_oss_image(request):
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
        object_key = data.get('object_key')

        if not object_key:
            return JsonResponse({'error': 'object_key is required'}, status=400)

        bucket_name = os.getenv('OSS_BUCKET')
        region = os.getenv('OSS_REGION')
        endpoint = f"https://{region}.aliyuncs.com"
        actual_region = region.replace(
            'oss-', '') if region.startswith('oss-') else region

        credentials_provider = oss.credentials.EnvironmentVariableCredentialsProvider()

        cfg = oss.config.load_default()
        cfg.credentials_provider = credentials_provider
        cfg.region = actual_region
        cfg.endpoint = endpoint

        client = oss.Client(cfg)

        try:
            # 使用 DeleteObjectRequest 创建删除请求
            delete_request = DeleteObjectRequest(
                bucket=bucket_name,
                key=object_key
            )

            # 执行删除操作
            result = client.delete_object(delete_request)

            print(
                f"[INFO] Successfully deleted: {object_key}, status: {result.status_code if result else 'N/A'}")

            return JsonResponse({
                'message': 'Image deleted successfully',
                'object_key': object_key
            }, status=200)

        except Exception as delete_error:
            error_msg = str(delete_error)
            print(f"[ERROR] OSS Delete Operation Failed: {error_msg}")

            # 判断是否是对象不存在的错误
            if 'NoSuchKey' in error_msg or 'does not exist' in error_msg:
                return JsonResponse({
                    'message': 'Image already deleted or does not exist',
                    'object_key': object_key
                }, status=200)

            return JsonResponse({
                'error': 'Delete operation failed',
                'detail': error_msg,
                'object_key': object_key
            }, status=500)

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        print(f"[ERROR] OSS Delete Failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return JsonResponse(
            {'error': 'OSS Delete Failed', 'detail': str(e)},
            status=500
        )


@csrf_exempt
@api_view(['DELETE'])
@permission_classes([IsAuthenticated, CanDelete])
def delete_oss_images_batch(request):
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
        object_keys = data.get('object_keys', [])

        if not object_keys or not isinstance(object_keys, list):
            return JsonResponse({'error': 'object_keys must be a non-empty array'}, status=400)

        if len(object_keys) > 1000:
            return JsonResponse({'error': 'Maximum 1000 objects can be deleted at once'}, status=400)

        bucket_name = os.getenv('OSS_BUCKET')
        region = os.getenv('OSS_REGION')
        endpoint = f"https://{region}.aliyuncs.com"
        actual_region = region.replace(
            'oss-', '') if region.startswith('oss-') else region

        credentials_provider = oss.credentials.EnvironmentVariableCredentialsProvider()

        cfg = oss.config.load_default()
        cfg.credentials_provider = credentials_provider
        cfg.region = actual_region
        cfg.endpoint = endpoint

        client = oss.Client(cfg)

        # 批量删除对象
        deleted_objects = []
        failed_objects = []

        for object_key in object_keys:
            try:
                # 使用 DeleteObjectRequest
                delete_request = DeleteObjectRequest(
                    bucket=bucket_name,
                    key=object_key
                )

                result = client.delete_object(delete_request)
                deleted_objects.append(object_key)
                print(f"[INFO] Successfully deleted: {object_key}")

            except Exception as e:
                error_msg = str(e)

                # 如果对象不存在，也认为删除成功
                if 'NoSuchKey' in error_msg or 'does not exist' in error_msg:
                    deleted_objects.append(object_key)
                    print(
                        f"[INFO] Object already deleted or does not exist: {object_key}")
                else:
                    # 其他错误记录为失败
                    failed_objects.append({
                        'key': object_key,
                        'error': error_msg
                    })
                    print(
                        f"[ERROR] Failed to delete {object_key}: {error_msg}")

        # 根据是否有失败项决定返回状态码
        status_code = 200 if len(failed_objects) == 0 else 207  # 207 表示部分成功

        return JsonResponse({
            'message': f'Deleted {len(deleted_objects)} images',
            'deleted': deleted_objects,
            'failed': failed_objects,
            'total_requested': len(object_keys),
            'total_deleted': len(deleted_objects),
            'total_failed': len(failed_objects)
        }, status=status_code)

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        print(f"[ERROR] OSS Batch Delete Failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return JsonResponse(
            {'error': 'OSS Batch Delete Failed', 'detail': str(e)},
            status=500
        )
