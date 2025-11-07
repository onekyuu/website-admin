# 📃 Website Admin Dashboard

**Languages**: [中文](./README.md) | **English** | [日本語](./README.ja.md)

A full-featured blog management system with article publishing, project showcase, gallery management and more. Supports multi-language switching (Chinese/English/Japanese), provides rich text editor and Alibaba Cloud OSS storage integration.

## 🛠 Tech Stack

### Backend

- **Framework**: Django 4.2
- **Database**: PostgreSQL 17
- **Authentication**: JWT (djangorestframework-simplejwt)
- **API Documentation**: drf-yasg (Swagger)
- **Object Storage**: Alibaba Cloud OSS (alibabacloud-oss-v2)
- **Image Processing**: Pillow, exifread (EXIF metadata extraction)
- **Deployment**: Gunicorn + Docker

### Frontend

- **Framework**: Next.js 15.3.0 (App Router)
- **React**: 19.0.0
- **Language**: TypeScript 5
- **UI Components**: Radix UI + shadcn/ui
- **Rich Text Editor**: TipTap 2.11.7
- **State Management**: Zustand 5.0.3
- **Data Fetching**: React Query 5.74.4
- **Internationalization**: next-intl 4.0.2
- **Styling**: Tailwind CSS 4.1.4
- **Form Validation**: React Hook Form + Zod
- **Charts**: Recharts 2.15.3
- **Theme**: next-themes (Dark/Light mode)

## 🚀 Deployment

### Docker Compose Deployment (Recommended)

1. **Clone the project**

```bash
git clone <repository-url>
cd website-admin
```

2. **Configure environment variables**

Backend (`backend/.env`):

```bash
# Database configuration
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=db
DB_PORT=5432

# Django configuration
SECRET_KEY=your_django_secret_key
DEBUG=False
ALLOWED_HOSTS=your_domain.com

# Alibaba Cloud OSS configuration
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET_NAME=your_bucket_name
OSS_ENDPOINT=your_oss_endpoint
OSS_REGION=your_region
```

Frontend (`frontend/.env`):

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. **Start services**

```bash
docker-compose up -d
```

Access URLs:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/swagger/

### Local Development Deployment

#### Backend

```bash
cd backend

# Install dependencies
pipenv install --dev

# Activate virtual environment
pipenv shell

# Database migration
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

#### Frontend

```bash
cd frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build production version
pnpm build
```

## 📖 User Guide

### Feature Modules

#### 1. Blog Management

- ✍️ Rich Text Editor: Based on TipTap with Markdown syntax support
- 🏷️ Category Management: Multi-level category support
- 🔖 Tag System: Multi-tag classification for articles
- 🌐 Multi-language Support: Chinese/English/Japanese content translation
- 📸 Image Upload: Integrated with Alibaba Cloud OSS storage

#### 2. Project Showcase

- 📁 Project Management: Project information entry and display
- 🔗 Tech Stack Tags: Technology classification for projects
- 🖼️ Project Cover: Support for cover image upload
- 🌍 Multi-language Translation: Multi-language versions of project titles and descriptions

#### 3. Gallery Management

- 📷 Photo Upload: Automatic thumbnail generation
- 📊 EXIF Metadata: Automatic extraction of shooting parameters (aperture, shutter, ISO, focal length, etc.)
- 🗺️ Geolocation: Extract GPS information (latitude, longitude, altitude)
- 🎨 Category Tags: Photo classification management
- 🖼️ Fullscreen Preview: Drawer-style photo viewer

#### 4. User Authentication

- 🔐 JWT Authentication: Token refresh mechanism
- 👤 User Management: Permission control
- 🍪 Cookie Storage: Secure authentication state persistence

#### 5. Interface Features

- 🌓 Dark/Light theme switching
- 📱 Responsive Design: Mobile and desktop adaptation
- 🌏 Language Switching: Support for Chinese/English/Japanese switching
- 🎯 Sidebar Navigation: Clear module division

## 🎯 Key Features

### Backend Features

1. **RESTful API Design**

   - Unified API response format
   - Comprehensive error handling mechanism
   - Swagger automatic documentation generation

2. **Alibaba Cloud OSS Integration**

   - Unified file upload/delete interface
   - Automatic thumbnail generation support
   - Image EXIF metadata extraction

3. **Database Optimization**

   - PostgreSQL JSON fields for complex data storage
   - Proper index design
   - Foreign key relationship optimization

4. **Django Admin Enhancement**
   - django-jazzmin beautified admin interface
   - django-import-export data import/export
   - CKEditor rich text editor integration

### Frontend Features

1. **Modern Tech Stack**

   - Next.js 15 App Router architecture
   - React Server Components support
   - TypeScript type safety

2. **Excellent User Experience**

   - TipTap rich text editor (Markdown support)
   - React Query data caching optimization
   - Optimistic updates and automatic retry mechanism

3. **Component-based Development**

   - Radix UI accessible components
   - shadcn/ui reusable component library
   - Custom TipTap extension nodes

4. **Internationalization Support**

   - next-intl complete i18n solution
   - Automatic language detection
   - Route internationalization

5. **Performance Optimization**
   - Image lazy loading
   - Code splitting
   - Bundle optimization

## 📂 Project Structure

```
website-admin/
├── backend/              # Django backend
│   ├── api/             # API application
│   │   ├── blog/        # Blog module
│   │   ├── gallery/     # Gallery module
│   │   ├── projects/    # Projects module
│   │   └── oss/         # OSS utilities
│   ├── website/         # Django configuration
│   └── manage.py
├── frontend/            # Next.js frontend
│   ├── app/            # App Router pages
│   ├── components/     # React components
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utility functions
│   └── messages/       # Internationalization texts
└── docker-compose.yml  # Docker orchestration
```

## 💡 Development Guide

### Backend Development

1. **Create new API module**

```bash
cd backend
python manage.py startapp your_app_name
```

2. **Database migration**

```bash
# Create migration files
python manage.py makemigrations

# Apply migrations
python manage.py migrate
```

3. **Django Admin access**

- Access: http://localhost:8000/admin
- Login with superuser account

### Frontend Development

1. **Add new page**

```bash
# Create new directory under app/(main)/[locale]/
cd frontend/app/(main)/[locale]
mkdir your-page
```

2. **Create new component**

```bash
# Add component using shadcn/ui
pnpm dlx shadcn@latest add button
```

3. **Add internationalization text**
   Add corresponding translations in language files under `frontend/messages/`

## 📝 Common Tasks

### Upload images to OSS

Use the `uploadToOSS` function from `lib/oss-upload.tsx` on the frontend:

```typescript
import { uploadToOSS } from "@/lib/oss-upload";

const url = await uploadToOSS(file, "blog");
```

### Use rich text editor

```tsx
import MarkdownEditor from "@/components/MarkdownEditor";

<MarkdownEditor value={content} onChange={setContent} />;
```

### API requests

Use React Query for data fetching:

```typescript
import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";

const { data } = useQuery({
  queryKey: ["posts"],
  queryFn: () => fetcher("/api/posts/"),
});
```

## 🔧 Configuration

### Alibaba Cloud OSS Configuration

1. Login to Alibaba Cloud Console
2. Create OSS Bucket
3. Obtain AccessKey and SecretKey
4. Configure CORS rules to allow cross-domain access

### PostgreSQL Database

Default configuration is in `docker-compose.yml`, modify if needed:

```yaml
db:
  image: postgres:17
  environment:
    POSTGRES_DB: your_db_name
    POSTGRES_USER: your_username
    POSTGRES_PASSWORD: your_password
```

### Next.js Environment Variables

`frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 📄 License

MIT License

## 👤 Author

OneKyuu

## 🤝 Contributing

Issues and Pull Requests are welcome!
