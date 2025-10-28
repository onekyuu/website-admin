"use client";

import { FC, useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

import { ModeToggle } from "./ModeToggle";
import LocaleSwitcher from "./LocaleSwitcher";
import { SidebarTrigger } from "./ui/sidebar";
import { Separator } from "./ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";

const routeNameMap: Record<string, string> = {
  dashboard: "Dashboard",
  posts: "Posts",
  categories: "Categories",
  tags: "Tags",
  comments: "Comments",
  users: "Users",
  settings: "Settings",
  profile: "Profile",
  projects: "Projects",
  create: "Create",
  edit: "Edit",
  detail: "Detail",
};

const shouldSkipSegment = (segment: string, index: number, paths: string[]) => {
  const nextSegment = paths[index + 1];
  if (nextSegment && ["detail", "edit", "update"].includes(nextSegment)) {
    return true;
  }
  if (!routeNameMap[segment] && segment.includes("-")) {
    return true;
  }

  return false;
};

const Header: FC = () => {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    const localeMatch = pathname.match(/^\/([a-z]{2})/);
    const locale = localeMatch ? localeMatch[1] : "";
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, "");

    const paths = pathWithoutLocale.split("/").filter(Boolean);
    const crumbs: Array<{ name: string; href: string; isLast: boolean }> = [];

    paths.forEach((path, index) => {
      if (shouldSkipSegment(path, index, paths)) {
        return;
      }

      const href = locale
        ? `/${locale}/${paths.slice(0, index + 1).join("/")}`
        : `/${paths.slice(0, index + 1).join("/")}`;

      const name =
        routeNameMap[path] || path.charAt(0).toUpperCase() + path.slice(1);

      crumbs.push({
        name,
        href,
        isLast: index === paths.length - 1,
      });
    });

    if (crumbs.length > 0) {
      crumbs[crumbs.length - 1].isLast = true;
    }

    const homeHref = locale ? `/${locale}` : "/";

    return [
      { name: "Home", href: homeHref, isLast: crumbs.length === 0 },
      ...crumbs,
    ];
  }, [pathname]);

  return (
    <div className="h-16 w-full flex items-center justify-between pr-8">
      <div className="flex items-center">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.href} className="flex items-center">
                <BreadcrumbItem>
                  {crumb.isLast ? (
                    <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href}>{crumb.name}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!crumb.isLast && <BreadcrumbSeparator />}
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex w-max gap-4">
        <LocaleSwitcher />
        <ModeToggle />
      </div>
    </div>
  );
};

export default Header;
