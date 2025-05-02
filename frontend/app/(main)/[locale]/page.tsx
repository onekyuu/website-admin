"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigations";

export const metadata = {
  title: "OneKyuu Admin Platform",
  description: "OneKyuu's personal management platform.",
  openGraph: {
    title: "OneKyuu Admin Platform",
    description: "OneKyuu's personal management platform.",
    url: "https://admin.keyu.wang",
    images: [
      "https://onekyuu-blog.oss-cn-shanghai.aliyuncs.com/uploads/1745970336851-tcf2o5/python.png",
    ],
  },
};

export default function Page() {
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    router.replace(`/dashboard`);
  }, [router, locale]);

  return null;
}
