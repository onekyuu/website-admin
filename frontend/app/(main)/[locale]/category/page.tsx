"use client";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import React, { FC, useState } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
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
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import { get, post } from "@/lib/fetcher";
import { useTranslations } from "next-intl";
import { DataTable } from "@/components/DataTable";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { uploadToOSS } from "@/lib/oss-upload"; // Import the uploadToOSS function
import { toast } from "sonner";

export interface Category {
  id: number;
  title: string;
  slug: string;
  image: string;
}

const CategoryPage: FC = () => {
  const t = useTranslations();
  const [open, setOpen] = React.useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data: categories, refetch } = useQuery({
    queryKey: ["categories", pagination],
    queryFn: () =>
      get<{ id: number; title: string; slug: string; image: string }[]>(
        `/post/category/list/?page=${pagination.pageIndex + 1}`,
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
              <img
                src={row.original.image}
                alt="Image"
                className="rounded-md object-cover h-full"
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
            variant={"outline"}
            onClick={() => {
              console.log("Edit", row.original);
            }}
          >
            Edit
          </Button>
          <Button
            variant="outline"
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

  const formSchema = z.object({
    title: z.string({
      required_error: t("Post.titleErrorMessage"),
    }),
    image: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      image: "",
    },
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
      form.reset();
      setOpen(false);
      console.log("User created:", data);
    },
    onError: (error) => {
      toast.error("创建失败");
      console.error("Error creating user:", error);
    },
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    mutation.mutate(data);
  };

  return (
    <div>
      <div className="mb-8">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">{t("Category.create")}</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t("Category.create")}</DialogTitle>
              <DialogDescription>
                {t("Category.createDescription")}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                className="space-y-4"
                onSubmit={form.handleSubmit(handleSubmit)}
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Category.title")}</FormLabel>
                      <FormControl>
                        <Input required {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Category.image")}</FormLabel>
                      <FormControl>
                        <Input
                          id="picture"
                          type="file"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const imageUrl = await uploadToOSS(file);
                                field.onChange(imageUrl);
                                toast.success(t("Category.imageUploadSuccess"));
                              } catch (error) {
                                console.error("Image upload failed:", error);
                                toast.error(t("Category.imageUploadError"));
                              }
                            }
                          }}
                          placeholder="Upload an image"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="submit">{t("Category.submit")}</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <DataTable columns={columns} data={categories || []} />
    </div>
  );
};

export default CategoryPage;
