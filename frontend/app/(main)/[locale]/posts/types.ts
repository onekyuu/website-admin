export type LanguageCode = "zh" | "en" | "ja";

export interface PostTranslationContent {
  title: string;
  description: string;
  content: string;
}

export type PostTranslation = {
  [K in LanguageCode]?: PostTranslationContent;
};

export interface CreatePostBaseData {
  user_id?: number;
  category?: number;
  image?: string;
  status?: string;
  need_ai_generate?: boolean;
}

export type CreatePostData = CreatePostBaseData & PostTranslation;

export interface UpdatePostBaseData {
  category?: number;
  image?: string;
  status?: string;
  is_ai_generated?: boolean;
}

export interface UpdateExtraInfo {
  id: number;
  user_id: number;
}

export type UpdatePostData = UpdatePostBaseData &
  PostTranslation &
  UpdateExtraInfo;

export interface GetPostTranslationContent {
  title: string;
  description: string;
  content: string;
  is_ai_generated: boolean;
}

export type GetPostTranslation = {
  [K in LanguageCode]?: GetPostTranslationContent;
};

export interface PostUser {
  id: number;
  username: string;
  email: string;
  avatar?: string;
}

export interface PostProfile {
  user: PostUser;
  avatar?: string;
}

export interface PostCategory {
  id: number;
  title: string;
  slug: string;
  image?: string;
}

export interface GetPostBaseData {
  id: number;
  user: PostUser;
  profile: PostProfile;
  image?: string;
  slug: string;
  category: PostCategory;
  status?: string;
  views: number;
  likes: number[]; // 如果 likes 字段是用户ID数组
  date: string;
  translations: GetPostTranslation;
}

export type GetPostData = GetPostBaseData;

export interface PostListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: GetPostData[];
}

export interface PostFormInitialBaseData {
  category?: string;
  image?: string;
  status?: string;
  need_ai_generate?: boolean;
  is_ai_generated?: boolean;
  language?: LanguageCode;
}

export type PostFormInitialData = PostFormInitialBaseData &
  PostTranslationContent;
