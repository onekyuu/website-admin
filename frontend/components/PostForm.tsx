"use client";

import React, { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/fetcher";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { PostFormInitialData } from "@/app/(main)/[locale]/posts/types";

interface PostFormProps {
  mode: "create" | "edit";
  userId?: number;
  initialValues?: PostFormInitialData;
  onChange: (data: PostFormInitialData) => void;
}

export const PostForm: React.FC<PostFormProps> = ({
  mode,
  initialValues,
  onChange,
}) => {
  const t = useTranslations();
  const didInit = useRef(false);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      get<{ id: number; title: string; slug: string; image: string }[]>(
        `/post/category/list/`,
      ),
  });

  const formSchema = z.object({
    title: z.string({
      required_error: t("Post.titleErrorMessage"),
    }),
    description: z
      .string()
      .max(100, {
        message: t("Post.descriptionErrorMessage"),
      })
      .optional(),
    content: z.string(),
    category: z.string(),
    need_ai_generate: z.boolean().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialValues?.title || "",
      description: initialValues?.description || "",
      content: initialValues?.content || "",
      category: initialValues?.category || "",
      need_ai_generate: false,
    },
  });

  useEffect(() => {
    const subscription = form.watch((values) => {
      onChange?.(values as PostFormInitialData);
    });
    return () => subscription.unsubscribe();
  }, [form, onChange]);

  useEffect(() => {
    console.log("initialValues", initialValues);
    if (initialValues && !didInit.current) {
      form.reset({
        title: initialValues?.title || "",
        description: initialValues?.description || "",
        content: initialValues?.content || "",
        category: initialValues?.category || "",
        need_ai_generate: false,
      });
      didInit.current = true;
    }
  }, [initialValues, form]);

  return (
    <div>
      <div className="mb-6">
        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      required
                      {...field}
                      placeholder={t("Post.titlePlaceholder")}
                    />
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
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("Post.descriptionPlaceholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-4 items-center gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Category.category")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("Category.select")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem
                            key={category.id}
                            value={category.id.toString()}
                          >
                            {category.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {mode === "create" && (
                <FormField
                  control={form.control}
                  name="need_ai_generate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Post.needAITranslation")}</FormLabel>
                      <Switch
                        onCheckedChange={field.onChange}
                        checked={field.value}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {mode === "edit" && initialValues?.is_ai_generated && (
                <div className="flex items-center gap-2 self-baseline-last">
                  <Image
                    className="rounded-md object-cover"
                    width={24}
                    height={24}
                    src={"/deepseek.svg"}
                    alt="deepseek"
                  />
                  <div className="text-sm">Translated by Deepseek</div>
                </div>
              )}
            </div>
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <SimpleEditor
                  key={initialValues?.language}
                  content={field.value ? JSON.parse(field.value) : ""}
                  onChange={field.onChange}
                />
              )}
            />
          </form>
        </Form>
      </div>
    </div>
  );
};

export default PostForm;
