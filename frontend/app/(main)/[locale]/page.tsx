"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigations";

export default function Page() {
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    router.replace(`/dashboard`);
  }, [router, locale]);

  return null;
}
