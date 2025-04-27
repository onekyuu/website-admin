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
import { useMemo } from "react";
import { NavSecondary } from "./NavSecondary";
import { Link } from "@/i18n/navigations";
import { useTranslations } from "next-intl";

export function AppSidebar() {
  const t = useTranslations();
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

  const navUser = useMemo(
    () => ({
      name: userProfile?.user.username || "",
      email: userProfile?.user.email || "",
      avatar: userProfile?.user.image || "",
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
      ],
    },
    {
      title: "Category",
      url: "/category",
      icon: <ChartBarStacked className="size-4" />,
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

        {userProfile?.user.is_superuser && (
          <NavSecondary items={navSecondary} className="mt-auto" />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
