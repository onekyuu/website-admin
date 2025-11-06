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
}
export interface ProjectTranslationData {
  title: string;
  description: string;
}

export type ProjectTranslation = {
  [K in LanguageCode]?: ProjectTranslationData;
};

export type Project = ProjectBase & { translations: ProjectTranslation };

export interface CreateProjectBaseData {
  images?: string[];
  skill_ids?: number[];
}

export type CreateProjectData = CreateProjectBaseData & {
  translations: ProjectTranslation;
};

export interface NewProjectData {
  title: string;
  description: string;
  images?: string[];
  skill_ids: number[];
  is_featured?: boolean;
}

export interface UpdateProjectExtraInfo {
  id: number;
}

export type UpdateProjectData = CreateProjectData & UpdateProjectExtraInfo;

export type ProjectFormInitialData = Omit<NewProjectData, "id">;
