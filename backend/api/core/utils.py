def get_file_url(obj, field_name, request=None):
    """
    统一处理文件URL
    如果是完整URL则直接返回，否则拼接完整路径
    """
    field_value = getattr(obj, field_name, None)
    if field_value:
        field_str = str(field_value)
        if field_str.startswith('http://') or field_str.startswith('https://'):
            return field_str
        elif request:
            try:
                return request.build_absolute_uri(field_value.url)
            except Exception:
                return field_str
        return field_str
    return None