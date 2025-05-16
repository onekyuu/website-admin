"use client";

import { get } from "@/lib/fetcher";
import { useQuery } from "@tanstack/react-query";
import React, { useMemo } from "react";
import { PostData } from "../../page";
import { useParams } from "next/navigation";
import PostForm, { LanguageCode, Post } from "@/components/PostForm";
import useUserData from "@/hooks/useUserData";

const PostEditPage = () => {
  const params = useParams();
  const slug = params?.slug;
  const locale = params?.locale as LanguageCode;
  const userId = useUserData()?.user_id;
  const { data } = useQuery({
    queryKey: ["post-detail", slug],
    queryFn: () => get<PostData>(`/post/detail/${slug}/`),
  });

  const initalValues = useMemo(() => {
    const translations = data?.translations;
    const defaultLanguage = locale || "zh";
    const translation = translations?.find(
      (item) => item.language === defaultLanguage,
    );
    return {
      ...data,
      ...translations,
      user_id: Number(userId),
      category: data?.category.id,
    };
  }, [data, locale, userId]);

  console.log("data", data);

  const handleSubmit = async (data: Post) => {};
  return (
    <div>
      <PostForm
        initialValues={initalValues}
        userId={Number(userId)}
        onSubmit={handleSubmit}
        defaltLanguage={locale}
      />
    </div>
  );
};

export default PostEditPage;
