"use client";
import { get, del } from "@/lib/fetcher";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocale, useTranslations } from "next-intl";
import { useImmer } from "use-immer";
import { DataTable } from "@/components/DataTable";
import { useRouter } from "@/i18n/navigations";
import dayjs from "dayjs";
import { GetPostData, LanguageCode, PostListResponse } from "./types";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/auth";

const PostPage = () => {
  const t = useTranslations();
  const locale = useLocale() as LanguageCode;
  const userId = useAuthStore((state) => state.allUserData)?.user_id;
  const router = useRouter();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data, refetch } = useQuery({
    queryKey: ["post-list", pagination],
    queryFn: () =>
      get<PostListResponse>(`/post/lists/?page=${pagination.pageIndex + 1}`),
  });
  const [posts, setPosts] = useImmer<GetPostData[]>([]);

  const handleDeletePost = async (id: number) => {
    const response = await del(
      `/author/dashboard/post-detail/${userId}/${id}/`,
    );
    return response;
  };

  const deleteMutation = useMutation({
    mutationFn: handleDeletePost,
    onSuccess: (data) => {
      toast.success(t("Post.deleteSuccess"));
      refetch();
    },
    onError: (error) => {
      toast.error(t("Post.deleteError"));
      console.error("Error deleting post:", error);
    },
  });

  const onDeletePost = (id: number) => {
    if (!userId) {
      toast.error(t("Post.userNotFound"));
      return;
    }
    if (!id) {
      toast.error(t("Post.postNotFound"));
      return;
    }
    deleteMutation.mutate(id);
  };

  useEffect(() => {
    if (data) {
      setPosts(data.results);
    }
  }, [data, setPosts]);

  const columns: ColumnDef<GetPostData>[] = [
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
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => row.original.category.title,
    },
    {
      accessorKey: "status",
      header: "Status",
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <div>{dayjs(row.original.date).format("YYYY-MM-DD")}</div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size={"sm"}
            variant={"outline"}
            onClick={() => {
              router.push(`/posts/${row.original.slug}/detail`);
            }}
          >
            {t("Post.detail")}
          </Button>
          <Button
            size={"sm"}
            variant={"outline"}
            onClick={() => {
              router.push(`/posts/${row.original.slug}/edit`);
            }}
          >
            {t("Post.edit")}
          </Button>
          <Button
            size={"sm"}
            variant="outline"
            onClick={() => {
              onDeletePost(row.original.id);
            }}
          >
            {t("Post.delete")}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <DataTable
        columns={columns}
        data={posts}
        pagination={pagination}
        rowCount={data?.count || 0}
        onPaginationChange={setPagination}
      />
    </div>
  );
};

export default PostPage;
