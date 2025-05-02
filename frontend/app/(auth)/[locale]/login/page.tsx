"use client";

import LoginForm from "@/components/LoginForm";
import { useRouter } from "@/i18n/navigations";
import { login } from "@/lib/auth";
import { useTranslations } from "next-intl";
import { FC, useEffect } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/auth";
import { Boxes } from "lucide-react";
import dayjs from "dayjs";

const LoginPage: FC = () => {
  const t = useTranslations("Login");
  const router = useRouter();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn());
  const handleSubmit = async (data: { email: string; password: string }) => {
    try {
      const signInResult = await login(data);
      console.log("signInResult", signInResult);
      if (signInResult) {
        toast.success(t("signInSuccess"));
      }
      router.push("/");
    } catch (error) {
      console.error("Login failed", error);
      toast.error(t("signInError"));
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      // 已经登录，跳转回首页/dashboard
      router.replace("/dashboard");
    }
  }, [isLoggedIn, router]);
  return (
    <div className="flex flex-1 items-center h-full w-full">
      <div className="w-md h-dvh bg-[var(--color-background-2)] grid place-items-center text-left relative">
        <div className="col-span-4 space-y-4 text-left absolute top-8 left-8 ">
          <div className="text-xl flex items-center gap-2">
            <Boxes size={"30px"} />
            SEELE-ADMIN
          </div>
        </div>
        <div className="space-y-4">
          <div className="text-3xl">Admin</div>
          <div className="text-xl">for Onekyuu&apos;s Website</div>
        </div>
        <footer className="absolute bottom-4 text-sm text-[var(--color-gray-500)]">
          &copy; {dayjs().year()} Onekyuu. All rights reserved.
        </footer>
      </div>
      <div className="flex flex-1 items-center justify-center h-full">
        <LoginForm onSubmit={handleSubmit} />
      </div>
    </div>
    // <Layout className="h-full">
    // </Layout>
  );
};

export default LoginPage;
