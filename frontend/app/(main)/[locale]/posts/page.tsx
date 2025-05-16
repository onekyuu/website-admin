"use client";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { get } from "@/lib/fetcher";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocale, useTranslations } from "next-intl";
import { useImmer } from "use-immer";
import { LocaleType } from "@/app/types";
import { DataTable } from "@/components/DataTable";
import { useRouter } from "@/i18n/navigations";
import dayjs from "dayjs";
import { Category } from "@/components/CategoryDialog";

export interface PostTranslation {
  id: number;
  language: LocaleType;
  title: string;
  description: string;
  content: string;
  is_ai_generated: boolean;
}

export interface PostData {
  id: number;
  slug: string;
  image: string;
  status: string;
  date: string;
  category: Category;
  translations: PostTranslation[];
  user: {
    id: number;
    username: string;
    email: string;
    image: string;
  };
}

type PostListItem = PostData & {
  title?: string;
  description?: string;
  content?: string;
  language: LocaleType;
};

const PostPage = () => {
  const t = useTranslations();
  const locale = useLocale() as LocaleType;
  const router = useRouter();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data, refetch } = useQuery({
    queryKey: ["post-list", pagination],
    queryFn: () =>
      get<{ count: number; results: PostData[] }>(
        `/post/lists/?page=${pagination.pageIndex + 1}`,
      ),
  });
  const [posts, setPosts] = useImmer<PostListItem[]>([]);

  useEffect(() => {
    if (data) {
      setPosts(() => {
        return data.results?.map((post) => {
          const { translations, ...rest } = post;
          if (!translations) return post;
          const targetTranslation = translations.filter(
            (item) => item.language === locale,
          )[0];
          if (!targetTranslation) return post;

          const { id, ...translationContent } = targetTranslation;
          return { ...rest, ...translationContent };
        });
      });
    }
  }, [data, setPosts, locale]);

  const columns: ColumnDef<PostListItem>[] = [
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
              console.log("Delete", row.original);
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
