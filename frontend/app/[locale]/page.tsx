"use client";

import LocaleSwitcher from "@/components/LocaleSwitcher";
import { Button } from "@/components/ui/button";
import useBearStore from "@/lib/stores/store";
import { ModeToggle } from "@/components/ModeToggle";
import { useQuery } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetcher";

export default function Home() {
  const bears = useBearStore((state) => state.bears);
  const increase = useBearStore((state) => state.increase);
  const { data, isLoading, error } = useQuery({
    queryKey: ["posts"],
    queryFn: () => fetcher("/user/profile/2/"),
  });

  console.log("data", data);
  console.log("isLoading", isLoading);
  console.log("error", error);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Button variant="outline">Button</Button>
        <LocaleSwitcher />
        <p className="text-2xl font-bold">{`bears ${bears}`}</p>
        <Button onClick={() => increase(1)}>增加</Button>
        <ModeToggle />
      </main>
    </div>
  );
}
