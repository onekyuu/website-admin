"use client";
import { FC } from "react";
import Header from "./Header";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout: FC<LayoutProps> = ({ children, className }) => {
  return (
    <div className={"min-h-screen w-screen flex flex-col"}>
      <Header />
      <div className={cn(`flex flex-col flex-1 ${className ?? ""}`)}>
        {children}
      </div>
    </div>
  );
};

export default Layout;
