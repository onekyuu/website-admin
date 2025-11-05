import { SkillType } from "@/lib/constants";

export interface Skill {
  id: number;
  name: string;
  image_url: string;
  type: SkillType;
}
