"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Boxes, Command, FileText, LayoutDashboard } from "lucide-react";
import { NavUser } from "./NavUser";
import useUserData from "@/lib/useUserData";
import { get } from "@/lib/fetcher";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { NavSecondary } from "./NavSecondary";
import { Link } from "@/i18n/navigations";

export function AppSidebar() {
  const userId = useUserData()?.user_id;
  const {
    data: userProfile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["posts"],
    queryFn: () =>
      get<{
        user: {
          username: string;
          email: string;
          image: string;
          is_superuser: boolean;
        };
      }>(`/user/profile/${userId}/`),
  });
  console.log("isLoading", isLoading);
  console.log("error", error);

  const data = useMemo(
    () => ({
      user: {
        name: userProfile?.user.username || "",
        email: userProfile?.user.email || "",
        avatar: userProfile?.user.image || "",
      },
      navSecondary: [
        {
          title: "Register",
          url: "/register",
          icon: Command,
        },
      ],
    }),
    [userProfile],
  );
  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Boxes className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">SEELE</span>
                  <span className="truncate text-xs">Admin</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link href="/dashboard">
                <LayoutDashboard className="size-4" />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link href="/posts">
                <FileText className="size-4" />
                <span>Post</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {userProfile?.user.is_superuser && (
          <NavSecondary items={data.navSecondary} className="mt-auto" />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
