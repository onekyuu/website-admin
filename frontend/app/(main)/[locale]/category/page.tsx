"use client";
import { ColumnDef } from "@tanstack/react-table";
import React, { FC } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/fetcher";
import { useTranslations } from "next-intl";
import { DataTable } from "@/components/DataTable";
export interface Category {
  id: number;
  title: string;
  slug: string;
  image: string;
}

const CategoryPage: FC = () => {
  const t = useTranslations();
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      get<{ id: number; title: string; slug: string; image: string }[]>(
        `/post/category/list/`,
      ),
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
            <AspectRatio ratio={16 / 9}>
              <Image
                width={60}
                height={60}
                src="../../../../public/vercel.svg"
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
      <div className="mb-8">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">{t("Category.create")}</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t("Category.create")}</DialogTitle>
              <DialogDescription>Create new Category</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  {t("Common.title")}
                </Label>
                <Input id="name" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  Username
                </Label>
                <Input id="username" value="@peduarte" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <DataTable columns={columns} data={categories || []} />
    </div>
  );
};

export default CategoryPage;
