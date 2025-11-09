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

  const { data: skills } = useQuery({
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
    setNewProject((draft) => {
      if (!draft) return;

      if (!draft.translations) {
        draft.translations = {};
      }
      draft.translations[language] = {
        title: data.title || "",
        description: data.description || "",
        info: data.info || [],
      };

      draft.images = data.images;
      draft.skill_ids = data.skill_ids || [];
      draft.need_ai_generate = data.need_ai_generate || false;
      draft.is_featured = data.is_featured || false;
    });
  };

  const initialValues = useCallback(
    (lang: LanguageCode): ProjectFormInitialData | undefined => {
      if (!newProject) return undefined;

      return {
        images: newProject.images || [],
        title: newProject.translations?.[lang]?.title || "",
        description: newProject.translations?.[lang]?.description || "",
        skill_ids: newProject.skill_ids || [],
        info: newProject.translations?.[lang]?.info || [],
        need_ai_generate: newProject.need_ai_generate || false,
        is_featured: newProject.is_featured || false,
      };
    },
    [newProject, projectData],
  );

  useEffect(() => {
    if (projectData) {
      setNewProject({
        id: projectData.id,
        slug: projectData.slug,
        translations: projectData.translations,
        images: projectData.images,
        skill_ids: projectData.skills.map((skill) => skill.id),
        need_ai_generate: projectData.need_ai_generate || false,
        is_featured: projectData.is_featured || false,
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
                key={`${option.value}-${newProject.slug}`}
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
