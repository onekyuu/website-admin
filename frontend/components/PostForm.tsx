"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/fetcher";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

export type LanguageCode = "zh" | "en" | "ja";
interface TranslationContent {
  title: string;
  description: string;
  content: string;
  is_ai_generated?: boolean;
  language?: LanguageCode;
}
interface BasePost {
  user_id?: number;
  category?: number;
  translations?: TranslationContent[];
}
export type Post = BasePost;

interface PostFormProps {
  userId?: number;
  initialValues?: Post;
  onSubmit: (data: Post) => Promise<void>;
  loading?: boolean;
  submitText?: string;
  defaltLanguage?: LanguageCode;
}

export const PostForm: React.FC<PostFormProps> = ({
  userId,
  initialValues,
  onSubmit,
  loading,
  defaltLanguage = "zh",
}) => {
  const t = useTranslations();
  const [content, setContent] = useState(
    initialValues?.translations?.find(
      (trans) => trans.language === defaltLanguage,
    )?.content || "",
  );

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
    language: z.enum(["zh", "en", "ja"]),
    category: z.string(),
    need_ai_generate: z.boolean().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title:
        initialValues?.translations?.find(
          (trans) => trans.language === defaltLanguage,
        )?.title || "",
      description:
        initialValues?.translations?.find(
          (trans) => trans.language === defaltLanguage,
        )?.description || "",
      language: defaltLanguage || "zh",
      category: initialValues?.category?.toString() || "",
    },
  });

  useEffect(() => {
    if (initialValues)
      setContent(
        initialValues.translations?.find(
          (trans) => trans.language === defaltLanguage,
        )?.content || "",
      );
    form.reset({
      title:
        initialValues?.translations?.find(
          (trans) => trans.language === defaltLanguage,
        )?.title || "",
      description:
        initialValues?.translations?.find(
          (trans) => trans.language === defaltLanguage,
        )?.description || "",
      language: defaltLanguage || "zh",
      category: initialValues?.category?.toString() || "",
    });
  }, [
    initialValues?.translations,
    initialValues?.category,
    defaltLanguage,
    categories,
    form,
  ]);

  const handleSave = () => {
    if (!userId) {
      console.error("User ID is required");
      return;
    }
    const { title, description, language, category } = form.getValues();
    const newPost: Post = {
      user_id: Number(userId),
      category: parseInt(category),
      [language]: {
        title,
        description,
        content,
      },
    };
    onSubmit(newPost);
  };

  const SaveButton = (
    <Button key={"save-post"} onClick={handleSave}>
      {/* {mutation.isPending && <Loader2 className="animate-spin" />} */}
      {t("Common.save")}
    </Button>
  );

  console.log("content", content);

  return (
    <div>
      <div className="mb-6">
        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
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
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Post.language")}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <div className="flex items-center space-x-4">
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="zh" id="zh" />
                          </FormControl>
                          <Label htmlFor="zh">中文</Label>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="en" id="en" />
                          </FormControl>
                          <Label htmlFor="en">English</Label>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="ja" id="ja" />
                          </FormControl>
                          <Label htmlFor="ja">日本語</Label>
                        </FormItem>
                      </div>
                    </RadioGroup>
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
            </div>
            <div className="tiptap-editor">
              {content && (
                <SimpleEditor
                  content={JSON.parse(content)}
                  onChange={setContent}
                  extraButtons={[SaveButton]}
                />
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default PostForm;
