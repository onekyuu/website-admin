"use client";

import { get, post } from "@/lib/fetcher";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import React, { FC, useState } from "react";
import { Gallery, GalleryListResponse } from "./types";
import GalleryCard from "@/components/GalleryCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";
import Image from "next/image";
import { useAuthStore } from "@/lib/stores/auth";

const GalleryPage: FC = () => {
  const t = useTranslations("Gallery");
  const [open, setOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const userPermissions = useAuthStore(
    (state) => state.allUserData,
  )?.permissions;

  const { data: galleryList, refetch } = useQuery({
    queryKey: ["gallery"],
    queryFn: () => get<GalleryListResponse>(`/gallery/list/`),
  });

  const formSchema = z.object({
    file: z
      .instanceof(File)
      .refine((file) => file.size <= 20 * 1024 * 1024, {
        message: "File size must be less than 20MB",
      })
      .refine(
        (file) =>
          ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(
            file.type,
          ),
        {
          message: "Only JPEG, PNG, GIF, and WebP images are allowed",
        },
      ),
    title: z.string(),
    description: z.string(),
    // category: z.string().optional(),
    // tags: z.string().optional(),
    is_featured: z.boolean(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      file: undefined,
      title: "",
      description: "",
      // category: "",
      // tags: "",
      is_featured: false,
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (userPermissions?.is_guest) {
        throw new Error("Guest users are not allowed to upload photos.");
      }
      const formData = new FormData();
      formData.append("file", values.file);

      if (values.title) {
        formData.append("title", values.title);
      }
      if (values.description) {
        formData.append("description", values.description);
      }
      // if (values.category) {
      //   formData.append("category", values.category);
      // }
      // if (values.tags) {
      //   // 将逗号分隔的字符串转换为数组
      //   const tagsArray = values.tags
      //     .split(",")
      //     .map((tag) => tag.trim())
      //     .filter(Boolean);
      //   formData.append("tags", JSON.stringify(tagsArray));
      // }
      formData.append("is_featured", String(values.is_featured));

      const response = await post("/gallery/create/", formData);
      // if (!response.ok) {
      //   const error = await response.json();
      //   throw new Error(error.error || "Upload failed");
      // }

      return response;
    },
    onSuccess: () => {
      toast.success("Photo uploaded successfully");
      form.reset();
      setOpen(false);
      setPreviewUrl(null);
      refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    uploadMutation.mutate(values);
  };

  const handleFileChange = (file: File | undefined) => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
    }
  };

  const handleRemovePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    form.resetField("file");
  };

  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>{t("upload")}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("uploadPhoto")}</DialogTitle>
              <DialogDescription>
                {t("uploadPhotoDescription")}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel>Image File *</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              onChange(file);
                              handleFileChange(file);
                            }
                          }}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum file size: 20MB. Supported formats: JPEG, PNG,
                        GIF, WebP
                      </FormDescription>
                      {previewUrl && (
                        <div className="relative w-full rounded-lg border overflow-hidden bg-muted">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 z-10"
                            onClick={handleRemovePreview}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <div className="relative w-full aspect-video">
                            <Image
                              src={previewUrl}
                              alt="Preview"
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter photo title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter photo description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., landscape, portrait"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}

                {/* <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter tags separated by commas"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Separate multiple tags with commas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}

                <FormField
                  control={form.control}
                  name="is_featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Featured</FormLabel>
                        <FormDescription>
                          Mark this photo as featured
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      uploadMutation.isPending || userPermissions?.is_guest
                    }
                  >
                    {uploadMutation.isPending ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {galleryList?.results.map((gallery) => (
          <GalleryCard key={gallery.id} gallery={gallery} />
        ))}
      </div>
    </div>
  );
};

export default GalleryPage;
