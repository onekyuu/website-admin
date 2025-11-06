"use client";

import { DataTable } from "@/components/DataTable";
import Image from "next/image";
import { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { Skill } from "./types";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/lib/stores/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { del, get, patch, post } from "@/lib/fetcher";
import { toast } from "sonner";
import SkillDialog from "@/components/SkillDialog";

const SkillsPage = () => {
  const t = useTranslations("Project");
  const userPermissions = useAuthStore(
    (state) => state.allUserData,
  )?.permissions;

  const { data: skills, refetch } = useQuery({
    queryKey: ["skills"],
    queryFn: () => get<Skill[]>(`/projects/skill/list/`),
  });

  const handleCreateSkill = async (data: { name: string; image?: string }) => {
    const response = await post<
      { data: Skill },
      { name: string; image?: string }
    >("/projects/skill/create/", data);
    return response.data;
  };

  const mutation = useMutation({
    mutationFn: handleCreateSkill,
    onSuccess: (data) => {
      toast.success("创建成功");
      refetch();
    },
    onError: (error) => {
      toast.error("创建失败");
      console.error("Error creating user:", error);
    },
  });

  const handleEditSkill = async (data: {
    id: number;
    name: string;
    image?: string;
  }) => {
    const { id, ...updateData } = data;
    const response = await patch<
      { data: Skill },
      { name: string; image?: string }
    >(`/projects/skill/${id}/`, updateData);
    return response.data;
  };

  const editMutation = useMutation({
    mutationFn: handleEditSkill,
    onSuccess: (data) => {
      toast.success(t("Skill.editSuccess"));
      refetch();
    },
    onError: (error) => {
      toast.error(t("Skill.editError"));
      console.error("Error updating skill:", error);
    },
  });

  const handleCreateSubmit = async (
    data: Skill | { name: string; image?: string },
  ) => {
    mutation.mutate(data);
  };

  const handleEditSubmit = async (
    data: Skill | { name: string; image?: string },
  ) => {
    editMutation.mutate(data as Skill);
  };

  const createDialog = () => (
    <SkillDialog mode="create" handleSubmit={handleCreateSubmit} />
  );

  const editDialog = (data: Skill) => {
    return (
      <SkillDialog
        mode="edit"
        skillToEdit={data}
        handleSubmit={handleEditSubmit}
      />
    );
  };

  const handleDeleteSkill = async (id: number) => {
    const response = await del(`/projects/skill/${id}/`);
    return response;
  };

  const deleteMutation = useMutation({
    mutationFn: handleDeleteSkill,
    onSuccess: (data) => {
      toast.success(t("Skill.deleteSuccess"));
      refetch();
    },
    onError: (error) => {
      toast.error(t("Skill.deleteError"));
      console.error("Error deleting user:", error);
    },
  });

  const columns: ColumnDef<Skill>[] = [
    {
      accessorKey: "id",
      header: "id",
    },
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "image_url",
      header: "Image",
      cell: ({ row }) =>
        row.original.image_url && (
          <div className="w-20">
            <Image
              width={40}
              height={40}
              src={row.original.image_url}
              alt="Image"
              className="rounded-md object-cover h-full"
            />
          </div>
        ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          {editDialog(row.original)}
          <Button
            variant="outline"
            onClick={async () => {
              await deleteMutation.mutate(row.original.id);
            }}
            disabled={userPermissions?.is_guest}
          >
            {t("Skill.delete")}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-8">{createDialog()}</div>
      <DataTable
        columns={columns}
        data={skills || []}
        pagination={{ pageIndex: 1, pageSize: 50 }}
      />
    </div>
  );
};

export default SkillsPage;
