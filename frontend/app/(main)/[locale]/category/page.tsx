"use client";
import { ColumnDef } from "@tanstack/react-table";
import React, { FC } from "react";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { del, get, patch, post } from "@/lib/fetcher";
import { useTranslations } from "next-intl";
import { DataTable } from "@/components/DataTable";
import { toast } from "sonner";
import Image from "next/image";
import CategoryDialog, { Category } from "@/components/CategoryDialog";
import { useAuthStore } from "@/lib/stores/auth";

const CategoryPage: FC = () => {
  const t = useTranslations();
  const userPermissions = useAuthStore(
    (state) => state.allUserData,
  )?.permissions;

  const { data: categories, refetch } = useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      get<{ id: number; title: string; slug: string; image: string }[]>(
        `/post/category/list/`,
      ),
  });

  const handleCreateCategory = async (data: {
    title: string;
    image?: string;
  }) => {
    const response = await post<
      { data: Category },
      { title: string; image?: string }
    >("/post/category/create/", data);
    return response.data;
  };

  const mutation = useMutation({
    mutationFn: handleCreateCategory,
    onSuccess: (data) => {
      toast.success("创建成功");
      refetch();
      console.log("User created:", data);
    },
    onError: (error) => {
      toast.error("创建失败");
      console.error("Error creating user:", error);
    },
  });

  const handleEditCategory = async (data: {
    id: number;
    title: string;
    image?: string;
  }) => {
    const { id, ...updateData } = data;
    const response = await patch<
      { data: Category },
      { title: string; image?: string }
    >(`/post/category/update/${id}/`, updateData);
    return response.data;
  };

  const editMutation = useMutation({
    mutationFn: handleEditCategory,
    onSuccess: (data) => {
      toast.success(t("Category.editSuccess"));
      refetch();
    },
    onError: (error) => {
      toast.error(t("Category.editError"));
      console.error("Error updating category:", error);
    },
  });

  const handleCreateSubmit = async (
    data: Category | { title: string; image?: string },
  ) => {
    mutation.mutate(data);
  };

  const handleEditSubmit = async (
    data: Category | { title: string; image?: string },
  ) => {
    editMutation.mutate(data as Category);
  };

  const createDialog = () => (
    <CategoryDialog mode="create" handleSubmit={handleCreateSubmit} />
  );

  const editDialog = (data: Category) => {
    return (
      <CategoryDialog
        mode="edit"
        categoryToEdit={data}
        handleSubmit={handleEditSubmit}
      />
    );
  };

  const handleDeleteCategory = async (id: number) => {
    const response = await del(`/post/category/update/${id}/`);
    return response;
  };

  const deleteMutation = useMutation({
    mutationFn: handleDeleteCategory,
    onSuccess: (data) => {
      toast.success(t("Category.deleteSuccess"));
      refetch();
      console.log("User deleted:", data);
    },
    onError: (error) => {
      toast.error(t("Category.deleteError"));
      console.error("Error deleting user:", error);
    },
  });

  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: "id",
      header: "id",
    },
    {
      accessorKey: "title",
      header: "Title",
    },
    {
      accessorKey: "slug",
      header: "Slug",
    },
    {
      accessorKey: "image",
      header: "Image",
      cell: ({ row }) =>
        row.original.image && (
          <div className="w-20">
            <Image
              width={40}
              height={40}
              src={row.original.image}
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
              console.log("Delete", row.original);
              await deleteMutation.mutate(row.original.id);
            }}
            disabled={userPermissions?.is_guest}
          >
            {t("Category.delete")}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-8">{createDialog()}</div>
      <DataTable columns={columns} data={categories || []} />
    </div>
  );
};

export default CategoryPage;
