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
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CreateProjectData, NewProjectData, Project } from "../types";
import { Skill } from "../skills/types";

const ProjectCreatePage = () => {
  const params = useParams();
  const locale = params?.locale as LanguageCode;
  const t = useTranslations();
  const router = useRouter();
  const userPermissions = useAuthStore(
    (state) => state.allUserData,
  )?.permissions;
  const [project, setProject] = React.useState<CreateProjectData>({
    images: [],
    skill_ids: [],
    is_featured: false,
    need_ai_generate: false,
    translations: {
      [locale]: {
        title: "",
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
        },
      },
      images: data.images,
      skill_ids: data.skill_ids || [],
      is_featured: data.is_featured || false,
      need_ai_generate: data.need_ai_generate || false,
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
      router.push("/projects");
    },
    onError: (error) => {
      toast.error("创建失败");
      console.error("Error creating user:", error);
    },
  });

  const { data: skills, refetch } = useQuery({
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
                skill_ids: project.skill_ids || [],
                title: project.translations[option.value]?.title || "",
                description:
                  project.translations[option.value]?.description || "",
                is_featured: project.is_featured || false,
                info: project.translations[option.value]?.info || [],
                need_ai_generate: project.need_ai_generate || false,
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
