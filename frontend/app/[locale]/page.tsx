"use client";

import LocaleSwitcher from "@/components/LocaleSwitcher";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";

export default function Home() {
  const t = useTranslations("login");
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Button variant="outline">Button</Button>
        <LocaleSwitcher />
        {t("welcome")}
      </main>
    </div>
  );
}
