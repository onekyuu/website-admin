"use client";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { get } from "@/lib/fetcher";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import React, { useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useLocale } from "next-intl";
import { useImmer } from "use-immer";
import { Category } from "../category/page";
import { LocaleType } from "@/app/types";
import { DataTable } from "@/components/DataTable";

interface Post {
  id: number;
  slug: string;
  image: string;
  status: string;
  date: string;
  category: Category;
  translations: {
    id: number;
    language: LocaleType;
    title: string;
    description: string;
    content: string;
  }[];
}

type PostListItem = Post & {
  title?: string;
  description?: string;
  content?: string;
  language: LocaleType;
};

const PostPage = () => {
  const locale = useLocale() as LocaleType;
  const { data } = useQuery({
    queryKey: ["post-list"],
    queryFn: () => get<{ results: Post[] }>(`/post/lists/`),
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
      accessorKey: "status",
      header: "Status",
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const date = new Date(row.original.date);
        return (
          <div>
            {date.toLocaleDateString(locale, {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })}
          </div>
        );
      },
    },
    {
      accessorKey: "image",
      header: "Image",
      cell: ({ row }) =>
        row.original.image && (
          <div className="w-20">
            <AspectRatio ratio={16 / 9}>
              <Image
                width={60}
                height={60}
                src={row.original.image}
                alt="Image"
                className="rounded-md object-cover"
              />
            </AspectRatio>
          </div>
        ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            onClick={() => {
              console.log("Edit", row.original);
            }}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              console.log("Delete", row.original);
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <DataTable columns={columns} data={posts} />
    </div>
  );
};

export default PostPage;
