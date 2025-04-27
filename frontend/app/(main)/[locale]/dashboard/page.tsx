"use client";

import { Button } from "@/components/ui/button";
import useBearStore from "@/lib/stores/store";

export default function Dashboard() {
  const bears = useBearStore((state) => state.bears);
  const increase = useBearStore((state) => state.increase);

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <main className="flex flex-col gap-[32px] row-start-2 items-center justify-center">
        <Button variant="outline">Button</Button>

        <p className="text-2xl font-bold">{`bears ${bears}`}</p>
        <Button onClick={() => increase(1)}>增加</Button>
      </main>
    </div>
  );
}
