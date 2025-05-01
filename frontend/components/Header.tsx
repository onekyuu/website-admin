import { FC } from "react";

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
import useUserData from "@/hooks/useUserData";

const Header: FC = () => {
  const user_id = useUserData()?.user_id;
  return (
    <div className="h-16 w-full flex items-center justify-between pr-8">
      {user_id ? (
        <div className="flex items-center">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">
                  Building Your Application
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Data Fetching</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      ) : (
        <div />
      )}
      <div className="flex w-max gap-4">
        <LocaleSwitcher />
        <ModeToggle />
      </div>
    </div>
  );
};

export default Header;
