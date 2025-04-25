"use client";

import LoginForm from "@/components/LoginForm";
import { useRouter } from "@/i18n/navigations";
import { FC } from "react";

const LoginPage: FC = () => {
  const router = useRouter();
  const handleSubmit = () => {
    router.push("/");
  };
  return (
    <div className="flex items-center justify-center">
      <LoginForm onSubmit={handleSubmit} />
    </div>
  );
};

export default LoginPage;
