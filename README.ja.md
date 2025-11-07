# 📃 ウェブサイト管理ダッシュボード

**言語**: [中文](./README.md) | [English](./README.en.md) | **日本語**

記事公開、プロジェクト展示、ギャラリー管理などの機能を備えた完全なブログ管理システムです。多言語切り替え（中国語/英語/日本語）に対応し、リッチテキストエディタと Alibaba Cloud OSS ストレージの統合を提供します。

## 🛠 技術スタック

### バックエンド

- **フレームワーク**: Django 4.2
- **データベース**: PostgreSQL 17
- **認証**: JWT (djangorestframework-simplejwt)
- **API ドキュメント**: drf-yasg (Swagger)
- **オブジェクトストレージ**: Alibaba Cloud OSS (alibabacloud-oss-v2)
- **画像処理**: Pillow, exifread (EXIF メタデータ抽出)
- **デプロイ**: Gunicorn + Docker

### フロントエンド

- **フレームワーク**: Next.js 15.3.0 (App Router)
- **React**: 19.0.0
- **言語**: TypeScript 5
- **UI コンポーネント**: Radix UI + shadcn/ui
- **リッチテキストエディタ**: TipTap 2.11.7
- **状態管理**: Zustand 5.0.3
- **データフェッチ**: React Query 5.74.4
- **国際化**: next-intl 4.0.2
- **スタイリング**: Tailwind CSS 4.1.4
- **フォーム検証**: React Hook Form + Zod
- **チャート**: Recharts 2.15.3
- **テーマ**: next-themes (ダーク/ライトモード)

## 🚀 デプロイ方法

### Docker Compose デプロイ（推奨）

1. **プロジェクトのクローン**

```bash
git clone <repository-url>
cd website-admin
```

2. **環境変数の設定**

バックエンド (`backend/.env`):

```bash
# データベース設定
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=db
DB_PORT=5432

# Django設定
SECRET_KEY=your_django_secret_key
DEBUG=False
ALLOWED_HOSTS=your_domain.com

# Alibaba Cloud OSS設定
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET_NAME=your_bucket_name
OSS_ENDPOINT=your_oss_endpoint
OSS_REGION=your_region
```

フロントエンド (`frontend/.env`):

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. **サービスの起動**

```bash
docker-compose up -d
```

アクセス URL:

- フロントエンド: http://localhost:3000
- バックエンド API: http://localhost:8000
- API ドキュメント: http://localhost:8000/swagger/

### ローカル開発デプロイ

#### バックエンド

```bash
cd backend

# 依存関係のインストール
pipenv install --dev

# 仮想環境の有効化
pipenv shell

# データベースマイグレーション
python manage.py migrate

# スーパーユーザーの作成
python manage.py createsuperuser

# 開発サーバーの起動
python manage.py runserver
```

#### フロントエンド

```bash
cd frontend

# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm dev

# プロダクションビルド
pnpm build
```

## 📖 使用ガイド

### 機能モジュール

#### 1. ブログ管理

- ✍️ リッチテキストエディタ: TipTap ベースで Markdown 構文をサポート
- 🏷️ カテゴリ管理: 多階層カテゴリサポート
- 🔖 タグシステム: 記事の複数タグ分類
- 🌐 多言語サポート: 中国語/英語/日本語のコンテンツ翻訳
- 📸 画像アップロード: Alibaba Cloud OSS ストレージと統合

#### 2. プロジェクト展示

- 📁 プロジェクト管理: プロジェクト情報の入力と表示
- 🔗 技術スタックタグ: プロジェクトで使用される技術の分類
- 🖼️ プロジェクトカバー: カバー画像のアップロード対応
- 🌍 多言語翻訳: プロジェクトタイトルと説明の多言語版

#### 3. ギャラリー管理

- 📷 写真アップロード: サムネイルの自動生成
- 📊 EXIF メタデータ: 撮影パラメータの自動抽出（絞り、シャッター速度、ISO、焦点距離など）
- 🗺️ 位置情報: GPS 情報の抽出（緯度、経度、高度）
- 🎨 カテゴリタグ: 写真の分類管理
- 🖼️ フルスクリーンプレビュー: ドロワー式写真ビューア

#### 4. ユーザー認証

- 🔐 JWT 認証: トークンリフレッシュメカニズム
- 👤 ユーザー管理: 権限制御
- 🍪 Cookie 保存: 安全な認証状態の維持

#### 5. インターフェース機能

- 🌓 ダーク/ライトテーマの切り替え
- 📱 レスポンシブデザイン: モバイルとデスクトップに対応
- 🌏 言語切り替え: 中国語/英語/日本語の切り替えサポート
- 🎯 サイドバーナビゲーション: 明確なモジュール分割

## 🎯 主な機能

### バックエンドの特徴

1. **RESTful API 設計**

   - 統一された API レスポンス形式
   - 包括的なエラーハンドリングメカニズム
   - Swagger 自動ドキュメント生成

2. **Alibaba Cloud OSS 統合**

   - 統一されたファイルアップロード/削除インターフェース
   - サムネイルの自動生成サポート
   - 画像 EXIF メタデータ抽出

3. **データベース最適化**

   - PostgreSQL JSON フィールドによる複雑なデータ保存
   - 適切なインデックス設計
   - 外部キーリレーションの最適化

4. **Django Admin 機能強化**
   - django-jazzmin による管理画面の美化
   - django-import-export によるデータインポート/エクスポート
   - CKEditor リッチテキストエディタの統合

### フロントエンドの特徴

1. **モダンな技術スタック**

   - Next.js 15 App Router アーキテクチャ
   - React Server Components サポート
   - TypeScript 型安全性

2. **優れたユーザーエクスペリエンス**

   - TipTap リッチテキストエディタ（Markdown サポート）
   - React Query データキャッシュ最適化
   - 楽観的更新と自動リトライメカニズム

3. **コンポーネントベース開発**

   - Radix UI アクセシブルコンポーネント
   - shadcn/ui 再利用可能なコンポーネントライブラリ
   - カスタム TipTap 拡張ノード

4. **国際化サポート**

   - next-intl 完全な i18n ソリューション
   - 自動言語検出
   - ルート国際化

5. **パフォーマンス最適化**
   - 画像の遅延読み込み
   - コード分割
   - バンドル最適化

## 📂 プロジェクト構造

```
website-admin/
├── backend/              # Djangoバックエンド
│   ├── api/             # APIアプリケーション
│   │   ├── blog/        # ブログモジュール
│   │   ├── gallery/     # ギャラリーモジュール
│   │   ├── projects/    # プロジェクトモジュール
│   │   └── oss/         # OSSユーティリティ
│   ├── website/         # Django設定
│   └── manage.py
├── frontend/            # Next.jsフロントエンド
│   ├── app/            # App Routerページ
│   ├── components/     # Reactコンポーネント
│   ├── hooks/          # カスタムフック
│   ├── lib/            # ユーティリティ関数
│   └── messages/       # 国際化テキスト
└── docker-compose.yml  # Dockerオーケストレーション
```

## 💡 開発ガイド

### バックエンド開発

1. **新しい API モジュールの作成**

```bash
cd backend
python manage.py startapp your_app_name
```

2. **データベースマイグレーション**

```bash
# マイグレーションファイルの作成
python manage.py makemigrations

# マイグレーションの適用
python manage.py migrate
```

3. **Django Admin アクセス**

- アクセス: http://localhost:8000/admin
- スーパーユーザーアカウントでログイン

### フロントエンド開発

1. **新しいページの追加**

```bash
# app/(main)/[locale]/ の下に新しいディレクトリを作成
cd frontend/app/(main)/[locale]
mkdir your-page
```

2. **新しいコンポーネントの作成**

```bash
# shadcn/uiを使用してコンポーネントを追加
pnpm dlx shadcn@latest add button
```

3. **国際化テキストの追加**
   `frontend/messages/` 配下の言語ファイルに対応する翻訳を追加

## 📝 一般的なタスク

### OSS への画像アップロード

フロントエンドで `lib/oss-upload.tsx` の `uploadToOSS` 関数を使用:

```typescript
import { uploadToOSS } from "@/lib/oss-upload";

const url = await uploadToOSS(file, "blog");
```

### リッチテキストエディタの使用

```tsx
import MarkdownEditor from "@/components/MarkdownEditor";

<MarkdownEditor value={content} onChange={setContent} />;
```

### API リクエスト

React Query を使用したデータフェッチ:

```typescript
import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";

const { data } = useQuery({
  queryKey: ["posts"],
  queryFn: () => fetcher("/api/posts/"),
});
```

## 🔧 設定説明

### Alibaba Cloud OSS 設定

1. Alibaba Cloud コンソールにログイン
2. OSS Bucket を作成
3. AccessKey と SecretKey を取得
4. クロスドメインアクセスを許可する CORS ルールを設定

### PostgreSQL データベース

デフォルト設定は `docker-compose.yml` にあります。変更が必要な場合:

```yaml
db:
  image: postgres:17
  environment:
    POSTGRES_DB: your_db_name
    POSTGRES_USER: your_username
    POSTGRES_PASSWORD: your_password
```

### Next.js 環境変数

`frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 📄 ライセンス

MIT License

## 👤 作者

OneKyuu

## 🤝 コントリビューション

Issue と Pull Request を歓迎します！
