"use client";

import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { del, get, patch, post } from "@/lib/fetcher";
import { useAuthStore } from "@/lib/stores/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import React from "react";
import { toast } from "sonner";
import Image from "next/image";
import { Project } from "./types";
import { useRouter } from "@/i18n/navigations";
import { LanguageCode } from "../posts/types";
import { ButtonGroup } from "@/components/ui/button-group";

const ProjectPage = () => {
  const t = useTranslations("Project");
  const router = useRouter();
  const userPermissions = useAuthStore(
    (state) => state.allUserData,
  )?.permissions;
  const locale = useLocale() as LanguageCode;

  const { data: projects, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: () => get<Project[]>(`/projects/list/`),
  });

  console.log("projects", projects);

  const handleCreateProject = async (data: {
    title: string;
    image?: string;
  }) => {
    const response = await post<
      { data: Project },
      { title: string; image?: string }
    >("/projects/create/", data);
    return response.data;
  };

  const mutation = useMutation({
    mutationFn: handleCreateProject,
    onSuccess: (data) => {
      toast.success("创建成功");
      refetch();
    },
    onError: (error) => {
      toast.error("创建失败");
      console.error("Error creating user:", error);
    },
  });

  const handleDeleteProject = async (id: number) => {
    const response = await del(`/projects/detail/${id}/`);
    return response;
  };

  const deleteMutation = useMutation({
    mutationFn: handleDeleteProject,
    onSuccess: (data) => {
      toast.success(t("Category.deleteSuccess"));
      refetch();
    },
    onError: (error) => {
      toast.error(t("Category.deleteError"));
      console.error("Error deleting user:", error);
    },
  });

  const columns: ColumnDef<Project>[] = [
    {
      accessorKey: "id",
      header: "id",
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => row.original.translations[locale]?.title,
    },
    {
      accessorKey: "slug",
      header: "Slug",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <ButtonGroup>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => {
                router.push(`/projects/${row.original.slug}/edit`);
              }}
            >
              {t("edit")}
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer"
              onClick={async () => {
                await deleteMutation.mutate(row.original.id);
              }}
              disabled={userPermissions?.is_guest}
            >
              {t("delete")}
            </Button>
          </ButtonGroup>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <Button
          className="cursor-pointer"
          onClick={() => {
            router.push(`/projects/new`);
          }}
        >
          {t("create")}
        </Button>
      </div>
      <DataTable columns={columns} data={projects || []} />
    </div>
  );
};

export default ProjectPage;
