"use client";
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
import useUserData from "@/hooks/useUserData";
import { get, post } from "@/lib/fetcher";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
// import { useImmer } from "use-immer";
import { z } from "zod";

type LanguageCode = "zh" | "en" | "ja";

interface TranslationContent {
  title: string;
  description: string;
  content: string;
}

type Translations = {
  [key in LanguageCode]?: TranslationContent;
};

interface BasePost {
  user_id: number;
  category: number;
  need_ai_generate?: boolean;
}

type Post = BasePost & Translations;

const PostCreatePage = () => {
  const t = useTranslations();
  const userId = useUserData()?.user_id;
  const [content, setContent] = useState("");
  // const [postData, setPostData] = useImmer({
  //   image: "",
  //   category: parseInt(""),
  //   status: "",
  // });

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
      title: "",
      description: "",
      language: "zh",
      category: "",
      need_ai_generate: false,
    },
  });

  const handleSavePost = async (data: Post) => {
    const response = await post<{ data: Post }, Post>(
      "/author/dashboard/post-create/",
      data,
    );
    return response.data;
  };

  const mutation = useMutation({
    mutationFn: handleSavePost,
    onSuccess: (data) => {
      toast.success("创建成功");
      console.log("User created:", data);
    },
    onError: (error) => {
      toast.error("创建失败");
      console.error("Error creating user:", error);
    },
  });

  const handleSave = () => {
    if (!userId) {
      toast.error(t("Post.userIdErrorMessage"));
      return;
    }
    const { title, description, language, category, need_ai_generate } =
      form.getValues();
    const newPost = {
      user_id: parseInt(userId),
      category: parseInt(category),
      [language]: {
        title,
        description,
        content,
      },
      need_ai_generate,
    };
    mutation.mutate(newPost);
  };

  const SaveButton = (
    <Button key={"save-post"} onClick={handleSave}>
      {mutation.isPending && <Loader2 className="animate-spin" />}
      {t("Common.save")}
    </Button>
  );

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
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Post.language")}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
          </form>
        </Form>
      </div>
      <div className="tiptap-editor">
        <SimpleEditor
          content={content}
          onChange={setContent}
          extraButtons={[SaveButton]}
        />
      </div>
    </div>
  );
};

export default PostCreatePage;
