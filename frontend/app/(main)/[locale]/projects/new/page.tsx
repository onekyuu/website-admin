"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import React from "react";
import { LanguageCode } from "../../posts/types";
import { useRouter } from "@/i18n/navigations";
import { useAuthStore } from "@/lib/stores/auth";
import { languageOptions } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import ProjectForm from "@/components/ProjectForm";
import { get, post } from "@/lib/fetcher";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CreateProjectData, NewProjectData, Project } from "../types";
import { Skill } from "../skills/types";

const ProjectCreatePage = () => {
  const params = useParams();
  const locale = params?.locale as LanguageCode;
  const t = useTranslations();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userPermissions = useAuthStore(
    (state) => state.allUserData,
  )?.permissions;
  const [project, setProject] = React.useState<CreateProjectData>({
    images: [],
    detail_images: [],
    skill_ids: [],
    is_featured: false,
    need_ai_generate: false,
    github_url: "",
    live_demo_url: "",
    involved_areas: "",
    tools: "",
    translations: {
      [locale]: {
        title: "",
        subtitle: { start: "", end: "" },
        summary: "",
        tech_summary: "",
        introduction: "",
        challenges: [],
        solutions: "",
        what_i_did: [],
        extra_info: {},
        description: "",
        info: [],
      },
    },
  });

  const handleChange = (data: NewProjectData, language: LanguageCode) => {
    setProject((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [language]: {
          title: data.title || "",
          description: data.description || "",
          info: data.info || [],
          subtitle: {
            start: data.subtitle_start || "",
            end: data.subtitle_end || "",
          },
          summary: data.summary || "",
          tech_summary: data.tech_summary || "",
          introduction: data.introduction || "",
          challenges: data.challenges || [],
          solutions: data.solutions || "",
          what_i_did: data.what_i_did || [],
          extra_info: data.extra_info || {},
        },
      },
      images: data.images,
      detail_images: data.detail_images,
      skill_ids: data.skill_ids || [],
      is_featured: data.is_featured || false,
      need_ai_generate: data.need_ai_generate || false,
      github_url: data.github_url || "",
      live_demo_url: data.live_demo_url || "",
      involved_areas: data.involved_areas || "",
      tools: data.tools || "",
    }));
  };

  const handleSaveProject = async (data: CreateProjectData) => {
    const response = await post<{ data: Project }, CreateProjectData>(
      "/projects/create/",
      data,
    );
    return response.data;
  };

  const mutation = useMutation({
    mutationFn: handleSaveProject,
    onSuccess: (data) => {
      toast.success("创建成功");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push("/projects");
    },
    onError: (error) => {
      toast.error("创建失败");
      console.error("Error creating user:", error);
    },
  });

  const { data: skills } = useQuery({
    queryKey: ["skills"],
    queryFn: () => get<Skill[]>(`/projects/skill/list/`),
  });

  const handleSave = () => {
    try {
      mutation.mutate(project);
    } catch (error) {
      console.error("Error saving project:", error);
    }
  };

  return (
    <div>
      <Tabs defaultValue={locale} className="w-full">
        <div className="w-full flex items-center justify-between">
          <TabsList>
            {languageOptions.map((option) => (
              <TabsTrigger key={option.value} value={option.value}>
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div>
            <Button
              key={"save-post"}
              onClick={handleSave}
              disabled={mutation.isPending || userPermissions?.is_guest}
            >
              {mutation.isPending && <Loader2 className="animate-spin" />}
              {t("Common.save")}
            </Button>
          </div>
        </div>

        {languageOptions.map((option) => (
          <TabsContent key={option.value} value={option.value}>
            <ProjectForm
              key={option.value}
              skills={skills || []}
              initialData={{
                images: project.images || [],
                detail_images: project.detail_images || [],
                skill_ids: project.skill_ids || [],
                title: project.translations[option.value]?.title || "",
                subtitle_start:
                  project.translations[option.value]?.subtitle?.start || "",
                subtitle_end:
                  project.translations[option.value]?.subtitle?.end || "",
                description:
                  project.translations[option.value]?.description || "",
                is_featured: project.is_featured || false,
                info: project.translations[option.value]?.info || [],
                need_ai_generate: project.need_ai_generate || false,
                github_url: project.github_url || "",
                live_demo_url: project.live_demo_url || "",
                involved_areas: project.involved_areas || "",
                tools: project.tools || "",
                summary: project.translations[option.value]?.summary || "",
                tech_summary:
                  project.translations[option.value]?.tech_summary || "",
                introduction:
                  project.translations[option.value]?.introduction || "",
                challenges:
                  project.translations[option.value]?.challenges || [],
                solutions: project.translations[option.value]?.solutions || "",
                what_i_did:
                  project.translations[option.value]?.what_i_did || [],
                extra_info:
                  project.translations[option.value]?.extra_info || {},
              }}
              onChange={(data) => handleChange(data, option.value)}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ProjectCreatePage;
