"use client";

import Layout from "@/components/Layout";
import LoginForm from "@/components/LoginForm";
import { useRouter } from "@/i18n/navigations";
import { login } from "@/lib/auth";
import { useTranslations } from "next-intl";
import { FC, useEffect } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/auth";

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
    <Layout>
      <div className="flex items-center justify-center">
        <LoginForm onSubmit={handleSubmit} />
      </div>
    </Layout>
  );
};

export default LoginPage;
