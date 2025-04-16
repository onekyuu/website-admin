# 使用官方 Python 镜像，带 slim 附加名以减小体积
FROM python:3.12-slim

# 设置环境变量，防止 encoding 警告
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV LANG=C.UTF-8

# 设置工作目录
WORKDIR /app

# 安装系统依赖（libpq-dev 是 PostgreSQL 驱动需要）
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 安装 pipenv
RUN pip install --upgrade pip pipenv

# 拷贝 Pipfile 文件并安装依赖
COPY Pipfile Pipfile.lock ./
RUN pipenv install --system --deploy --ignore-pipfile

# 拷贝整个项目代码（避免安装依赖后再复制可能会触发缓存失效）
COPY . .

# 收集静态文件
RUN python manage.py collectstatic --noinput

# 暴露端口
EXPOSE 8000

# 默认启动命令（一般由 docker-compose 覆盖）
CMD ["gunicorn", "blog.wsgi:application", "--bind", "0.0.0.0:8000"]