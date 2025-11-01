"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Boxes,
  ChartBarStacked,
  Command,
  FileText,
  LayoutDashboard,
  Package,
  PackageOpen,
} from "lucide-react";
import { NavUser } from "./NavUser";
import useUserData from "@/hooks/useUserData";
import { get } from "@/lib/fetcher";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { NavSecondary } from "./NavSecondary";
import { Link } from "@/i18n/navigations";
import { useTranslations } from "next-intl";
import { Permissions, useAuthStore } from "@/lib/stores/auth";
import { title } from "process";

export function AppSidebar() {
  const t = useTranslations();
  const userId = useUserData()?.user_id;
  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: () =>
      get<{
        user: {
          username: string;
          email: string;
        };
        id: number;
        is_superuser: boolean;
        avatar: string;
        role_name: string | null;
        permissions: Permissions | null;
      }>(`/user/profile/${userId}/`),
  });

  useEffect(() => {
    console.log("Fetched User Profile:", userProfile);
    if (userProfile) {
      useAuthStore.getState().setUser({
        user_id: userProfile.id.toString(),
        is_superuser: userProfile.is_superuser,
        avatar: userProfile.avatar,
        username: userProfile.user.username || null,
        email: userProfile.user.email || null,
        role_name: userProfile.role_name || null,
        permissions: userProfile.permissions || null,
      });
    }
  }, [userProfile]);

  const navUser = useMemo(
    () => ({
      name: userProfile?.user.username || "",
      email: userProfile?.user.email || "",
      avatar: userProfile?.avatar || "",
    }),
    [userProfile],
  );

  const navMain = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboard className="size-4" />,
    },
    {
      title: "Posts",
      icon: <Package className="size-4" />,
      items: [
        {
          title: "All Posts",
          url: "/posts",
          icon: <PackageOpen className="size-4" />,
        },
        {
          title: "New Post",
          url: "/posts/new",
          icon: <FileText className="size-4" />,
        },
        {
          title: "Blog Images",
          url: "/posts/images",
          icon: <FileText className="size-4" />,
        },
      ],
    },
    {
      title: "Category",
      url: "/category",
      icon: <ChartBarStacked className="size-4" />,
    },
    {
      title: "Projects",
      url: "/projects",
      icon: <Boxes className="size-4" />,
    },
    {
      title: "Gallery",
      url: "/gallery",
      icon: <Boxes className="size-4" />,
    },
  ];
  const navSecondary = [
    {
      title: t("Login.signUp"),
      url: "/signup",
      icon: Command,
    },
  ];

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
        <SidebarGroup>
          <SidebarMenu className="gap-2">
            {navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild size="lg">
                  {item.url ? (
                    <Link href={item.url}>
                      {item.icon}
                      <span>{item.title}</span>
                    </Link>
                  ) : (
                    <p>
                      {item.icon}
                      <span>{item.title}</span>
                    </p>
                  )}
                </SidebarMenuButton>
                {item.items?.length ? (
                  <SidebarMenuSub className="ml-0 border-l-0 px-1.5">
                    {item.items.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton asChild>
                          <Link href={item.url}>
                            {item.icon}
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {userProfile?.is_superuser && (
          <NavSecondary items={navSecondary} className="mt-auto" />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
