# 📃 OneKyuu Admin Dashboard

**语言**: **中文** | [日本語](./README.ja.md) | [English](./README.en.md)

为[OneKyuu Website](https://keyu.wang)制作的一个功能完整的个人网站管理系统，包含文章发布、项目展示、图库管理等功能。支持多语言切换（中文/英文/日文），提供富文本编辑器和阿里云 OSS 存储集成。

## 🛠 技术栈

### 后端

- **框架**: Django 4.2
- **数据库**: PostgreSQL 17
- **认证**: JWT (djangorestframework-simplejwt)
- **API 文档**: drf-yasg (Swagger)
- **对象存储**: 阿里云 OSS (alibabacloud-oss-v2)
- **图像处理**: Pillow, exifread (EXIF 元数据提取)
- **部署**: Gunicorn + Docker

### 前端

- **框架**: Next.js 15.3.0 (App Router)
- **React**: 19.0.0
- **语言**: TypeScript 5
- **UI 组件**: Radix UI + shadcn/ui
- **富文本编辑器**: TipTap 2.11.7
- **状态管理**: Zustand 5.0.3
- **数据请求**: React Query 5.74.4
- **国际化**: next-intl 4.0.2
- **样式**: Tailwind CSS 4.1.4
- **表单验证**: React Hook Form + Zod
- **图表**: Recharts 2.15.3
- **主题**: next-themes (深色/浅色模式)

## 🚀 部署方式

### Docker Compose 部署（推荐）

1. **克隆项目**

```bash
git clone <repository-url>
cd website-admin
```

2. **配置环境变量**

后端 (`backend/.env`):

```bash
# 数据库配置
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=db
DB_PORT=5432

# Django配置
SECRET_KEY=your_django_secret_key
DEBUG=False
ALLOWED_HOSTS=your_domain.com

# 阿里云OSS配置
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET_NAME=your_bucket_name
OSS_ENDPOINT=your_oss_endpoint
OSS_REGION=your_region
```

前端 (`frontend/.env`):

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. **启动服务**

```bash
docker-compose up -d
```

访问地址:

- 前端: http://localhost:3000
- 后端 API: http://localhost:8000
- API 文档: http://localhost:8000/swagger/

### 本地开发部署

#### 后端

```bash
cd backend

# 安装依赖
pipenv install --dev

# 激活虚拟环境
pipenv shell

# 数据库迁移
python manage.py migrate

# 创建超级用户
python manage.py createsuperuser

# 启动开发服务器
python manage.py runserver
```

#### 前端

```bash
cd frontend

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build
```

## 📖 使用介绍

### 功能模块

#### 1. 博客管理

- ✍️ 富文本编辑器：基于 TipTap 实现 Markdown 语法支持
- 🏷️ 分类管理：支持多级分类
- 🔖 标签系统：文章多标签归类
- 🌐 多语言支持：中文/英文/日文内容翻译
- 📸 图片上传：集成阿里云 OSS 存储

#### 2. 项目展示

- 📁 项目管理：项目信息录入和展示
- 🔗 技术栈标签：项目使用的技术分类
- 🖼️ 项目封面：支持封面图片上传
- 🌍 多语言翻译：项目标题和描述的多语言版本

#### 3. 图库管理

- 📷 照片上传：自动生成缩略图
- 📊 EXIF 元数据：自动提取拍摄参数（光圈、快门、ISO、焦距等）
- 🗺️ 地理位置：提取 GPS 信息（经纬度、海拔）
- 🎨 分类标签：照片分类管理
- 🖼️ 全屏预览：抽屉式照片查看器

#### 4. 用户认证

- 🔐 JWT 认证：Token 刷新机制
- 👤 用户管理：权限控制
- 🍪 Cookie 存储：安全的认证状态保持

#### 5. 界面特性

- 🌓 深色/浅色主题切换
- 📱 响应式设计：适配移动端和桌面端
- 🌏 语言切换：支持中/英/日三语切换
- 🎯 侧边栏导航：清晰的模块划分

## 🎯 功能特点

### 后端特点

1. **RESTful API 设计**

   - 统一的 API 响应格式
   - 完善的错误处理机制
   - Swagger 自动文档生成

2. **阿里云 OSS 集成**

   - 统一的文件上传/删除接口
   - 支持缩略图自动生成
   - 图片 EXIF 元数据提取

3. **数据库优化**

   - PostgreSQL JSON 字段存储复杂数据
   - 合理的索引设计
   - 外键关联优化

4. **Django Admin 增强**
   - django-jazzmin 美化后台界面
   - django-import-export 数据导入导出
   - CKEditor 富文本编辑器集成

### 前端特点

1. **现代化技术栈**

   - Next.js 15 App Router 架构
   - React Server Components 支持
   - TypeScript 类型安全

2. **优秀的用户体验**

   - TipTap 富文本编辑器（支持 Markdown）
   - React Query 数据缓存优化
   - 乐观更新和自动重试机制

3. **组件化开发**

   - Radix UI 无障碍组件
   - shadcn/ui 可复用组件库
   - 自定义 TipTap 扩展节点

4. **国际化支持**

   - next-intl 完整 i18n 方案
   - 语言自动检测
   - 路由国际化

5. **性能优化**
   - 图片懒加载
   - 代码分割
   - Bundle 优化

## 📂 项目结构

```
website-admin/
├── backend/              # Django后端
│   ├── api/             # API应用
│   │   ├── blog/        # 博客模块
│   │   ├── gallery/     # 图库模块
│   │   ├── projects/    # 项目模块
│   │   └── oss/         # OSS工具
│   ├── website/         # Django配置
│   └── manage.py
├── frontend/            # Next.js前端
│   ├── app/            # App Router页面
│   ├── components/     # React组件
│   ├── hooks/          # 自定义Hooks
│   ├── lib/            # 工具函数
│   └── messages/       # 国际化文本
└── docker-compose.yml  # Docker编排
```

## 💡 开发指南

### 后端开发

1. **创建新的 API 模块**

```bash
cd backend
python manage.py startapp your_app_name
```

2. **数据库迁移**

```bash
# 创建迁移文件
python manage.py makemigrations

# 应用迁移
python manage.py migrate
```

3. **Django Admin 访问**

- 访问: http://localhost:8000/admin
- 使用超级用户账号登录

### 前端开发

1. **添加新页面**

```bash
# 在 app/(main)/[locale]/ 下创建新目录
cd frontend/app/(main)/[locale]
mkdir your-page
```

2. **创建新组件**

```bash
# 使用 shadcn/ui 添加组件
pnpm dlx shadcn@latest add button
```

3. **添加国际化文本**
   在 `frontend/messages/` 下的语言文件中添加对应翻译

## � 常见任务

### 上传图片到 OSS

前端使用 `lib/oss-upload.tsx` 中的 `uploadToOSS` 函数：

```typescript
import { uploadToOSS } from "@/lib/oss-upload";

const url = await uploadToOSS(file, "blog");
```

### 使用富文本编辑器

```tsx
import MarkdownEditor from "@/components/MarkdownEditor";

<MarkdownEditor value={content} onChange={setContent} />;
```

### API 请求

使用 React Query 进行数据请求：

```typescript
import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";

const { data } = useQuery({
  queryKey: ["posts"],
  queryFn: () => fetcher("/api/posts/"),
});
```

## 🔧 配置说明

### 阿里云 OSS 配置

1. 登录阿里云控制台
2. 创建 OSS Bucket
3. 获取 AccessKey 和 SecretKey
4. 配置 CORS 规则允许跨域访问

### PostgreSQL 数据库

默认配置在 `docker-compose.yml` 中，如需修改：

```yaml
db:
  image: postgres:17
  environment:
    POSTGRES_DB: your_db_name
    POSTGRES_USER: your_username
    POSTGRES_PASSWORD: your_password
```

### Next.js 环境变量

`frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 📄 License

MIT License

## 👤 作者

OneKyuu

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
