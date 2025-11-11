import { LanguageCode } from "../posts/types";
import { Skill } from "./skills/types";

export interface ProjectBase {
  id: number;
  slug: string;
  created_at: string;
  updated_at: string;
  images: string[];
  detail_images?: string[];
  skills: Skill[];
  is_featured: boolean;
  need_ai_generate: boolean;
  github_url?: string;
  live_demo_url?: string;
  involved_areas?: string;
  tools?: string;
}
export interface ProjectTranslationData {
  title: string;
  subtitle?: {
    start: string;
    end: string;
  };
  description?: string;
  info: string[];
  summary?: string;
  tech_summary?: string;
  introduction?: string;
  challenges?: string[];
  solutions?: string;
  what_i_did?: string[];
  extra_info?: Record<string, string | string[] | Record<string, string>>;
}

export type ProjectTranslation = {
  [K in LanguageCode]?: ProjectTranslationData;
};

export type Project = ProjectBase & { translations: ProjectTranslation };

export interface CreateProjectBaseData {
  images?: string[];
  detail_images?: string[];
  skill_ids?: number[];
  is_featured: boolean;
  need_ai_generate: boolean;
  github_url?: string;
  live_demo_url?: string;
  involved_areas?: string;
  tools?: string;
}

export type CreateProjectData = CreateProjectBaseData & {
  translations: ProjectTranslation;
};

export interface NewProjectData {
  title: string;
  subtitle_start?: string;
  subtitle_end?: string;
  description?: string;
  info: string[];
  summary?: string;
  tech_summary?: string;
  introduction?: string;
  challenges?: string[];
  solutions?: string;
  what_i_did?: string[];
  extra_info?: Record<string, string | string[] | Record<string, string>>;
  images?: string[];
  detail_images?: string[];
  skill_ids: number[];
  is_featured: boolean;
  need_ai_generate: boolean;
  github_url?: string;
  live_demo_url?: string;
  involved_areas?: string;
  tools?: string;
}

export interface UpdateProjectExtraInfo {
  id: number;
  slug: string;
}

export type UpdateProjectData = CreateProjectData & UpdateProjectExtraInfo;

export type ProjectFormInitialData = Omit<NewProjectData, "id">;
