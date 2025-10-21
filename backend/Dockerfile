# 使用阿里云ACR 镜像
FROM registry.cn-hangzhou.aliyuncs.com/keyu-images/website-admin-base:v1.0.4

# 设置工作目录
WORKDIR /app

# 设置环境变量，防止 encoding 警告
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV LANG=C.UTF-8
ENV PYTHONPATH=/app

# 拷贝整个项目代码（避免安装依赖后再复制可能会触发缓存失效）
COPY . .

# 收集静态文件
RUN python manage.py collectstatic --noinput

# 暴露端口
EXPOSE 8000

# 默认启动命令（一般由 docker-compose 覆盖）
CMD ["gunicorn", "website.wsgi:application", "--bind", "0.0.0.0:8000"]