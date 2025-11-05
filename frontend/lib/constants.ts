import { LanguageCode } from "@/app/(main)/[locale]/posts/types";

export const languageOptions: { value: LanguageCode; label: string }[] = [
  { value: "zh", label: "中文" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
];

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export enum SkillType {
  FRONTEND = "Frontend",
  BACKEND = "Backend",
  DEVOPS = "DevOps",
}

export const SKILL_TYPE_LABELS: Record<SkillType, string> = {
  [SkillType.FRONTEND]: "Frontend",
  [SkillType.BACKEND]: "Backend",
  [SkillType.DEVOPS]: "DevOps",
};
