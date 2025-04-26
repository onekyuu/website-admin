"use client";

import LoginForm from "@/components/LoginForm";
import { useRouter } from "@/i18n/navigations";
import { login } from "@/lib/auth";
import { useTranslations } from "next-intl";
import { FC } from "react";
import { toast } from "sonner";

const LoginPage: FC = () => {
  const t = useTranslations("Login");
  const router = useRouter();
  const handleSubmit = async (data: { email: string; password: string }) => {
    const signInResult = await login(data);
    if (signInResult) {
      toast.success(t("signInSuccess"));
    }
    router.push("/");
  };
  return (
    <div className="flex items-center justify-center">
      <LoginForm onSubmit={handleSubmit} />
    </div>
  );
};

export default LoginPage;
