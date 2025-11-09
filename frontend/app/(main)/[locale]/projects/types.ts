import { LanguageCode } from "../posts/types";
import { Skill } from "./skills/types";

export interface ProjectBase {
  id: number;
  slug: string;
  created_at: string;
  updated_at: string;
  images: string[];
  skills: Skill[];
  is_featured: boolean;
  need_ai_generate: boolean;
}
export interface ProjectTranslationData {
  title: string;
  description: string;
  info: string[];
}

export type ProjectTranslation = {
  [K in LanguageCode]?: ProjectTranslationData;
};

export type Project = ProjectBase & { translations: ProjectTranslation };

export interface CreateProjectBaseData {
  images?: string[];
  skill_ids?: number[];
  is_featured: boolean;
  need_ai_generate: boolean;
}

export type CreateProjectData = CreateProjectBaseData & {
  translations: ProjectTranslation;
};

export interface NewProjectData {
  title: string;
  description: string;
  info: string[];
  images?: string[];
  skill_ids: number[];
  is_featured: boolean;
  need_ai_generate: boolean;
}

export interface UpdateProjectExtraInfo {
  id: number;
  slug: string;
}

export type UpdateProjectData = CreateProjectData & UpdateProjectExtraInfo;

export type ProjectFormInitialData = Omit<NewProjectData, "id">;
