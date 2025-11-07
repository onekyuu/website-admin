import os
import uuid
import json
from urllib.parse import urlencode
import alibabacloud_oss_v2 as oss
from alibabacloud_oss_v2.models import ListObjectsV2Request, DeleteObjectRequest, PutObjectRequest


def get_oss_client():
    region = os.getenv('OSS_REGION')
    endpoint = f"https://{region}.aliyuncs.com"
    actual_region = region.replace(
        'oss-', '') if region.startswith('oss-') else region

    credentials_provider = oss.credentials.EnvironmentVariableCredentialsProvider()

    cfg = oss.config.load_default()
    cfg.credentials_provider = credentials_provider
    cfg.region = actual_region
    cfg.endpoint = endpoint

    return oss.Client(cfg)


def upload_file_to_oss(file, directory='uploads'):
    try:
        allowed_extensions = ['.jpg', '.jpeg', '.png',
                              '.gif', '.webp', '.svg', '.bmp', '.ico']

        if hasattr(file, 'name') and file.name:
            file_name = file.name
            file_ext = os.path.splitext(file_name)[1].lower()
        else:
            file_name = 'thumbnail.jpg'
            file_ext = '.jpg'

        if file_ext not in allowed_extensions:
            raise ValueError(
                f'Invalid file type. Allowed: {", ".join(allowed_extensions)}')

        max_size = 20 * 1024 * 1024  # 20MB
        if hasattr(file, 'size') and file.size > max_size:
            raise ValueError(
                f'File too large. Maximum size: {max_size / 1024 / 1024}MB')

        unique_id = str(uuid.uuid4())[:6]
        original_name = os.path.splitext(file_name)[0]
        new_filename = f"{original_name}_{unique_id}{file_ext}"

        object_key = f"{directory}/{new_filename}"

        bucket_name = os.getenv('OSS_BUCKET')
        region = os.getenv('OSS_REGION')

        client = get_oss_client()

        if hasattr(file, 'read'):
            file_content = file.read()
        else:
            file_content = file

        result = client.put_object(
            PutObjectRequest(
                bucket=bucket_name,
                key=object_key,
                body=file_content
            ),
        )

        print(f"[INFO] Successfully uploaded: {object_key}")

        file_url = f"https://{bucket_name}.{region}.aliyuncs.com/{object_key}"

        return {
            'url': file_url,
            'object_key': object_key,
            'filename': new_filename,
            'size': file.size if hasattr(file, 'size') else len(file_content),
            'content_type': file.content_type if hasattr(file, 'content_type') else 'image/jpeg',
        }

    except Exception as e:
        print(f"[ERROR] OSS Upload Failed: {str(e)}")
        raise Exception(f"Upload failed: {str(e)}")


def delete_file_from_oss(object_key):
    try:
        bucket_name = os.getenv('OSS_BUCKET')
        client = get_oss_client()

        delete_request = DeleteObjectRequest(
            bucket=bucket_name,
            key=object_key
        )

        result = client.delete_object(delete_request)
        print(f"[INFO] Successfully deleted: {object_key}")

        return True

    except Exception as e:
        error_msg = str(e)
        if 'NoSuchKey' in error_msg or 'does not exist' in error_msg:
            print(
                f"[INFO] Object already deleted or does not exist: {object_key}")
            return True

        print(f"[ERROR] OSS Delete Failed: {error_msg}")
        return False


def delete_files_from_oss_batch(object_keys):
    if not object_keys or not isinstance(object_keys, list):
        raise ValueError('object_keys must be a non-empty array')

    if len(object_keys) > 1000:
        raise ValueError('Maximum 1000 objects can be deleted at once')

    bucket_name = os.getenv('OSS_BUCKET')
    client = get_oss_client()

    deleted_objects = []
    failed_objects = []

    for object_key in object_keys:
        try:
            delete_request = DeleteObjectRequest(
                bucket=bucket_name,
                key=object_key
            )

            result = client.delete_object(delete_request)
            deleted_objects.append(object_key)
            print(f"[INFO] Successfully deleted: {object_key}")

        except Exception as e:
            error_msg = str(e)

            if 'NoSuchKey' in error_msg or 'does not exist' in error_msg:
                deleted_objects.append(object_key)
                print(
                    f"[INFO] Object already deleted or does not exist: {object_key}")
            else:
                failed_objects.append({
                    'key': object_key,
                    'error': error_msg
                })
                print(f"[ERROR] Failed to delete {object_key}: {error_msg}")

    return {
        'deleted': deleted_objects,
        'failed': failed_objects,
        'total_requested': len(object_keys),
        'total_deleted': len(deleted_objects),
        'total_failed': len(failed_objects)
    }


def list_files_from_oss(prefix='uploads/', search='', page=1, page_size=50, image_only=True):
    try:
        bucket_name = os.getenv('OSS_BUCKET')
        region = os.getenv('OSS_REGION')

        client = get_oss_client()

        req = ListObjectsV2Request(
            bucket=bucket_name,
            prefix=prefix,
            max_keys=1000,
        )

        paginator = client.list_objects_v2_paginator()

        all_files = []
        image_extensions = ['.jpg', '.jpeg', '.png',
                            '.gif', '.webp', '.svg', '.bmp', '.ico']

        for page_result in paginator.iter_page(req):
            if page_result.contents:
                for obj in page_result.contents:
                    if obj.key.endswith('/'):
                        continue

                    if image_only and not any(obj.key.lower().endswith(ext) for ext in image_extensions):
                        continue

                    if search and search.lower() not in obj.key.lower():
                        continue

                    path_parts = obj.key.split('/')
                    prefix_parts = prefix.rstrip(
                        '/').split('/') if prefix else []
                    relative_parts = path_parts[len(
                        prefix_parts):-1] if len(prefix_parts) > 0 else path_parts[:-1]

                    if relative_parts:
                        directory_path = '/'.join(relative_parts)
                        directory_name = relative_parts[-1]
                    else:
                        directory_path = ''
                        directory_name = prefix.rstrip(
                            '/').split('/')[-1] if prefix else 'root'

                    all_files.append({
                        'name': obj.key,
                        'url': f"https://{bucket_name}.{region}.aliyuncs.com/{obj.key}",
                        'size': obj.size,
                        'lastModified': obj.last_modified.isoformat() if obj.last_modified else None,
                        'etag': obj.etag,
                        'directory': directory_path,
                        'directoryName': directory_name,
                        'fileName': path_parts[-1],
                        'fullPath': obj.key,
                    })

        all_files.sort(key=lambda x: x['lastModified'] or '', reverse=True)

        total_count = len(all_files)
        start_index = (page - 1) * page_size
        end_index = start_index + page_size
        paginated_files = all_files[start_index:end_index]

        return {
            'count': total_count,
            'page': page,
            'pageSize': page_size,
            'totalPages': (total_count + page_size - 1) // page_size,
            'results': paginated_files,
            'prefix': prefix,
        }

    except Exception as e:
        print(f"[ERROR] OSS List Failed: {str(e)}")
        raise Exception(f"List files failed: {str(e)}")
