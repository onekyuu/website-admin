"use client";

import { get, patch } from "@/lib/fetcher";
import { useQuery, useMutation } from "@tanstack/react-query";
import React, { useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import PostForm from "@/components/PostForm";
import useUserData from "@/hooks/useUserData";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useImmer } from "use-immer";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigations";
import { languageOptions } from "@/lib/constants";
import {
  GetPostData,
  LanguageCode,
  PostFormInitialData,
  UpdatePostData,
} from "../../types";

const PostEditPage = () => {
  const params = useParams();
  const slug = params?.slug;
  const locale = params?.locale as LanguageCode;
  const userId = useUserData()?.user_id;
  const t = useTranslations();
  const router = useRouter();

  const [newPost, setNewPost] = useImmer<UpdatePostData | null>(null);

  const { data: postData } = useQuery({
    queryKey: ["post-detail", slug],
    queryFn: () => get<GetPostData>(`/post/detail/${slug}/`),
  });

  const handleSavePost = async (data: UpdatePostData) => {
    const response = await patch<{ data: GetPostData }, UpdatePostData>(
      `/author/dashboard/post-detail/${userId}/${data.id}/`,
      data,
    );
    return response.data;
  };

  const mutation = useMutation({
    mutationFn: handleSavePost,
    onSuccess: (data) => {
      toast.success("更新成功");
      console.log(" updated:", data);
      router.push("/posts");
    },
    onError: (error) => {
      toast.error("更新失败");
      console.error("Error updating:", error);
    },
  });

  const handleSave = () => {
    if (!userId) {
      toast.error(t("Post.userIdErrorMessage"));
      return;
    }
    if (!postData?.id) {
      toast.error(t("Post.postIdErrorMessage"));
      return;
    }
    if (!newPost) {
      toast.error("Post not found");
      return;
    }

    mutation.mutate(newPost);
  };

  const handleChange = (data: PostFormInitialData, language: LanguageCode) => {
    setNewPost((draft) => {
      if (!draft) return;
      draft[language] = {
        title: data.title || "",
        description: data.description || "",
        content: data.content || "",
      };
      draft.category = data.category ? parseInt(data.category) : undefined;
      draft.image = data.image || "";
      draft.need_ai_generate = data.need_ai_generate;
    });
  };

  const initialValues = useCallback(
    (lang: LanguageCode) => {
      if (!postData) return undefined;
      return {
        title: postData?.translations?.[lang]?.title || "",
        description: postData?.translations?.[lang]?.description || "",
        content: postData?.translations?.[lang]?.content || "",
        category: postData.category.id.toString(),
        need_ai_generate: postData?.need_ai_generate || false,
        is_ai_generated:
          postData?.translations?.[lang]?.is_ai_generated || false,
        image: postData?.image || "",
      };
    },
    [postData],
  );

  useEffect(() => {
    if (postData) {
      setNewPost({
        ...postData,
        category: postData.category.id,
        user_id: postData.user.id,
      });
    }
  }, [postData, setNewPost]);

  return (
    <div>
      {newPost && (
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
                disabled={mutation.isPending}
              >
                {mutation.isPending && <Loader2 className="animate-spin" />}
                {t("Common.save")}
              </Button>
            </div>
          </div>

          {languageOptions.map((option) => (
            <TabsContent key={option.value} value={option.value}>
              <PostForm
                mode="edit"
                initialValues={initialValues(option.value as LanguageCode)}
                onChange={(data) =>
                  handleChange(data, option.value as LanguageCode)
                }
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};

export default PostEditPage;
