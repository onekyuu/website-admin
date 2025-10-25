"use client";
import { Button } from "@/components/ui/button";
import useUserData from "@/hooks/useUserData";
import { useRouter } from "@/i18n/navigations";
import { post } from "@/lib/fetcher";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useImmer } from "use-immer";

import React from "react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { languageOptions } from "@/lib/constants";
import PostForm from "@/components/PostForm";
import {
  CreatePostData,
  GetPostData,
  LanguageCode,
  PostFormInitialData,
} from "../types";
import { useAuthStore } from "@/lib/stores/auth";

const PostCreatePage = () => {
  const params = useParams();
  const locale = params?.locale as LanguageCode;
  const t = useTranslations();
  const router = useRouter();
  const userId = useUserData()?.user_id;
  const userPermissions = useAuthStore(
    (state) => state.allUserData,
  )?.permissions;
  const [newPost, setNewPost] = useImmer<CreatePostData>({
    category: undefined,
    user_id: parseInt(userId || ""),
    need_ai_generate: false,
    [locale]: {
      title: "",
      description: "",
      content: "",
    },
    image: undefined,
  });

  const handleSavePost = async (data: CreatePostData) => {
    const response = await post<{ data: GetPostData }, CreatePostData>(
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
      router.push("/posts");
    },
    onError: (error) => {
      toast.error("创建失败");
      console.error("Error creating user:", error);
    },
  });

  const handleChange = (data: PostFormInitialData, language: LanguageCode) => {
    setNewPost((draft) => {
      draft[language] = {
        title: data.title || "",
        description: data.description || "",
        content: data.content || "",
      };
      draft.category = data.category ? parseInt(data.category) : undefined;
      draft.need_ai_generate = data.need_ai_generate;
    });
  };

  const handleSave = () => {
    if (!userId) {
      toast.error(t("Post.userIdErrorMessage"));
      return;
    }
    if (!newPost?.category) {
      toast.error("Category is required");
      return;
    }
    mutation.mutate(newPost);
  };

  return (
    <div>
      <Tabs defaultValue={locale} className="w-full">
        <div className="w-full flex items-center justify-between">
          <TabsList>
            {languageOptions.map((option) => (
              <TabsTrigger key={option.value} value={option.value}>
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div>
            <Button
              key={"save-post"}
              onClick={handleSave}
              disabled={mutation.isPending || userPermissions?.is_guest}
            >
              {mutation.isPending && <Loader2 className="animate-spin" />}
              {t("Common.save")}
            </Button>
          </div>
        </div>

        {languageOptions.map((option) => (
          <TabsContent key={option.value} value={option.value}>
            <PostForm
              mode="create"
              initialValues={{
                category: newPost?.category?.toString() || "",
                need_ai_generate: newPost?.need_ai_generate || false,
                title: newPost?.[option.value as LanguageCode]?.title ?? "",
                description:
                  newPost?.[option.value as LanguageCode]?.description ?? "",
                content: newPost?.[option.value as LanguageCode]?.content ?? "",
                image: newPost?.image || "",
              }}
              onChange={(data) =>
                handleChange(data, option.value as LanguageCode)
              }
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default PostCreatePage;
