"use client";

import { get, patch } from "@/lib/fetcher";
import { useQuery, useMutation } from "@tanstack/react-query";
import React, { useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useImmer } from "use-immer";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigations";
import { languageOptions } from "@/lib/constants";
import {
  Project,
  ProjectFormInitialData,
  UpdateProjectData,
} from "../../types";
import ProjectForm from "@/components/ProjectForm";
import { LanguageCode } from "../../../posts/types";
import { Skill } from "../../skills/types";
import { useAuthStore } from "@/lib/stores/auth";

const ProjectEditPage = () => {
  const params = useParams();
  const slug = params?.slug;
  const locale = params?.locale as LanguageCode;
  const t = useTranslations();
  const router = useRouter();
  const userPermissions = useAuthStore(
    (state) => state.allUserData,
  )?.permissions;

  const [newProject, setNewProject] = useImmer<UpdateProjectData | null>(null);

  const { data: projectData } = useQuery({
    queryKey: ["project-detail", slug],
    queryFn: () => get<Project>(`/projects/detail/${slug}/`),
  });

  const { data: skills, refetch } = useQuery({
    queryKey: ["skills"],
    queryFn: () => get<Skill[]>(`/projects/skill/list/`),
  });

  const handleSaveProject = async (data: UpdateProjectData) => {
    const response = await patch<{ data: Project }, UpdateProjectData>(
      `/projects/detail/${data.slug}/`,
      data,
    );
    return response.data;
  };

  const mutation = useMutation({
    mutationFn: handleSaveProject,
    onSuccess: (data) => {
      toast.success("更新成功");
      router.push("/projects");
    },
    onError: (error) => {
      toast.error("更新失败");
      console.error("Error updating:", error);
    },
  });

  const handleSave = () => {
    if (!projectData?.id) {
      toast.error(t("Project.projectIdErrorMessage"));
      return;
    }
    if (!newProject) {
      toast.error("Project not found");
      return;
    }

    mutation.mutate(newProject);
  };

  const handleChange = (
    data: ProjectFormInitialData,
    language: LanguageCode,
  ) => {
    setNewProject((prev) => ({
      ...prev,
      translations: {
        ...prev?.translations,
        [language]: {
          title: data.title || "",
          description: data.description || "",
          info: data.info || [],
        },
      },
      images: data.images,
      skill_ids: data.skill_ids || [],
      need_ai_generate: data.need_ai_generate || false,
      is_featured: data.is_featured || false,
    }));
  };

  const initialValues = useCallback(
    (lang: LanguageCode) => {
      if (!projectData) return undefined;
      return {
        images: projectData?.images || [],
        skills: projectData?.skills || [],
        title: projectData.translations[lang]?.title || "",
        description: projectData.translations[lang]?.description || "",
        skill_ids: projectData.skills.map((skill) => skill.id) || [],
        info: projectData.translations[lang]?.info || [],
        need_ai_generate: projectData.need_ai_generate || false,
        is_featured: projectData.is_featured || false,
      };
    },
    [projectData],
  );

  useEffect(() => {
    if (projectData) {
      setNewProject({
        ...projectData,
      });
    }
  }, [projectData, setNewProject]);

  return (
    <div>
      {newProject && (
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
                key={"save-project"}
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
                mode="edit"
                initialData={initialValues(option.value)}
                onChange={(data) => handleChange(data, option.value)}
                skills={skills || []}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};

export default ProjectEditPage;
