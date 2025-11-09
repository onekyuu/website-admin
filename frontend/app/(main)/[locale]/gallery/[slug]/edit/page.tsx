"use client";

import { get, patch } from "@/lib/fetcher";
import { useAuthStore } from "@/lib/stores/auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useCallback } from "react";
import { useParams } from "next/navigation";
import { Gallery } from "../../types";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigations";

const GalleryEditPage = () => {
  const params = useParams();
  const slug = params?.slug;
  const t = useTranslations("Gallery");
  const router = useRouter();

  const userPermissions = useAuthStore(
    (state) => state.allUserData,
  )?.permissions;

  const { data: photoData } = useQuery({
    queryKey: ["gallery-detail", slug],
    queryFn: () => get<Gallery>(`/gallery/detail/${slug}/`),
  });

  const initialValues = useCallback(() => {
    if (!photoData) return undefined;
    return {
      title: photoData?.title || "",
      description: photoData?.description || "",
      is_featured: photoData?.is_featured || false,
    };
  }, [photoData]);

  const formSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    is_featured: z.boolean(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialValues()?.title || "",
      description: initialValues()?.description || "",
      is_featured: initialValues()?.is_featured || false,
    },
  });

  const handleSavePhoto = async (data: z.infer<typeof formSchema>) => {
    const response = await patch<{ data: Gallery }, z.infer<typeof formSchema>>(
      `/gallery/detail/${slug}/`,
      data,
    );
    return response.data;
  };

  const mutation = useMutation({
    mutationFn: handleSavePhoto,
    onSuccess: (data) => {
      toast.success("更新成功");
      router.push("/gallery");
    },
    onError: (error) => {
      toast.error("更新失败");
      console.error("Error updating:", error);
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    console.log("Form Data:", data);
    mutation.mutate(data);
  };

  return (
    <div>
      <Form {...form}>
        <form
          id="gallery-edit"
          className="space-y-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("editTitle")}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t("editTitlePlaceholder")} />
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
                <FormLabel>{t("editDescription")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("editDescriptionPlaceholder")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="is_featured"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-3 space-y-0">
                <FormLabel className="mb-0">{t("isFeatured")}</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
        <div className="my-6">
          {photoData?.image_url && (
            <Image
              src={photoData.image_url}
              alt={photoData?.title || ""}
              width={500}
              height={300}
              className="rounded-md"
              priority
            />
          )}
        </div>
        <div>
          <Button
            type="submit"
            form="gallery-edit"
            disabled={userPermissions?.is_guest}
          >
            {t("save")}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default GalleryEditPage;
