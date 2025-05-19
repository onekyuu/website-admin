"use client";

import React, { FC, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/fetcher";
import { useImmer } from "use-immer";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import dayjs from "dayjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GetPostData, LanguageCode } from "../../types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { languageOptions } from "@/lib/constants";

const PostDetailPage: FC = () => {
  const params = useParams();
  const slug = params?.slug;
  const locale = params?.locale as LanguageCode;
  const [postData, setPostData] = useImmer<GetPostData | null>(null);

  const { data } = useQuery({
    queryKey: ["post-detail", slug],
    queryFn: () => get<GetPostData>(`/post/detail/${slug}/`),
  });

  useEffect(() => {
    if (data) {
      setPostData(data);
    }
  }, [data, setPostData]);

  return (
    <div className="flex justify-center w-full p-4">
      <Tabs defaultValue={locale} className="w-full">
        <TabsList className="mx-12 mb-4">
          {languageOptions.map((option) => (
            <TabsTrigger key={option.value} value={option.value}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {languageOptions.map((option) => {
          const postContent =
            postData?.translations?.[option.value as LanguageCode];
          return (
            <TabsContent key={option.value} value={option.value}>
              <div className="w-5xl">
                <div className="px-12 flex flex-col gap-2">
                  <div className="flex items-center gap-8 text-(--color-gray-500)">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={data?.user?.avatar} />
                        <AvatarFallback>
                          {data?.user.username.slice(0, 3)}
                        </AvatarFallback>
                      </Avatar>
                      @{data?.user.username}
                    </div>
                    <div>{dayjs(data?.date).format("YYYY-MM-DD")}</div>
                  </div>
                  <div className="text-3xl">{postContent?.title}</div>
                  <div className="text-(--color-gray-500)">
                    {postContent?.description}
                  </div>
                  <div className="text-sm">
                    {data?.category && (
                      <Badge variant="secondary">
                        {postData?.category.title}
                      </Badge>
                    )}
                  </div>
                  {postContent?.is_ai_generated && (
                    <div className="flex items-center gap-2">
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
                {postContent?.content && (
                  <SimpleEditor
                    content={JSON.parse(postContent.content)}
                    editable={false}
                  />
                )}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default PostDetailPage;
