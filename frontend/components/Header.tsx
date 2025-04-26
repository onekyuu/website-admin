import { FC, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { useTranslations } from "next-intl";
import { logout } from "@/lib/auth";
import { useAuthStore } from "@/lib/stores/auth";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigations";
import { ModeToggle } from "./ModeToggle";
import LocaleSwitcher from "./LocaleSwitcher";

const Header: FC = () => {
  const t = useTranslations("Header");
  const router = useRouter();
  const isLoggedIn = useAuthStore().isLoggedIn();
  console.log("isLoggedIn", isLoggedIn);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  return (
    <div className="h-18 w-full bg-gray-800 flex items-center justify-between">
      <div>header</div>
      <div className="flex w-max gap-4">
        <LocaleSwitcher />
        <ModeToggle />
        {isMounted && isLoggedIn && (
          <Button
            variant="outline"
            onClick={async () => {
              await logout();
              router.push("/login");
              toast.success(t("signOutSuccess"));
            }}
          >
            {t("signOut")}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Header;
