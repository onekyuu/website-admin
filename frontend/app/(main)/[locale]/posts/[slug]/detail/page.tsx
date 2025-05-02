"use client";

import React, { FC, use, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/fetcher";
import { PostData, PostTranslation } from "../../page";
import { useImmer } from "use-immer";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { LocaleType } from "@/app/types";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import dayjs from "dayjs";

const PostDetailPage: FC = () => {
  const params = useParams();
  const slug = params?.slug;
  const locale = params?.locale;
  const [postData, setPostData] = useImmer<PostTranslation | null>(null);
  const [target, setTarget] = useImmer<LocaleType>(locale as LocaleType);

  const { data } = useQuery({
    queryKey: ["post-detail", slug],
    queryFn: () => get<PostData>(`/post/detail/${slug}/`),
  });

  useEffect(() => {
    if (data) {
      setPostData(() => {
        return data.translations.filter(
          (translation) => translation.language === target,
        )[0];
      });
    }
  }, [data, setPostData, target]);

  return (
    <div className="flex justify-center w-full p-4">
      <div className="w-5xl">
        <div className="px-12 flex flex-col gap-2">
          <div className="flex items-center gap-8 text-(--color-gray-500)">
            {data?.user && (
              <div>
                {/* <Image
                  src={data.user.image}
                  width={24}
                  height={24}
                  alt="avatar"
                /> */}
                @{data?.user.username}
              </div>
            )}
            {data && <div>{dayjs(data.date).format("YYYY-MM-DD")}</div>}
          </div>
          <div className="text-3xl">{postData?.title}</div>
          <div className="text-(--color-gray-500)">{postData?.description}</div>
          <div className="text-sm">
            {data?.category && (
              <Badge variant="secondary">{data.category.title}</Badge>
            )}
          </div>
          {postData?.is_ai_generated && (
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
        {postData?.content && (
          <SimpleEditor
            content={JSON.parse(postData.content)}
            editable={false}
          />
        )}
      </div>
    </div>
  );
};

export default PostDetailPage;
