"use client";

import LocaleSwitcher from "@/components/LocaleSwitcher";
import { Button } from "@/components/ui/button";
import useBearStore from "@/lib/stores/store";
import { useTranslations } from "next-intl";
import { ModeToggle } from "@/components/ModeToggle";

export default function Home() {
  const t = useTranslations("login");
  const bears = useBearStore((state) => state.bears);
  const increase = useBearStore((state) => state.increase);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Button variant="outline">Button</Button>
        <LocaleSwitcher />
        {t("welcome")}
        <p className="text-2xl font-bold">{`bears ${bears}`}</p>
        <Button onClick={() => increase(1)}>增加</Button>
        <ModeToggle />
      </main>
    </div>
  );
}
