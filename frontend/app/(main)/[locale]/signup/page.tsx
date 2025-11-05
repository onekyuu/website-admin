"use client";

import { FC } from "react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/PasswordInput";
import { useMutation } from "@tanstack/react-query";
import { post } from "@/lib/fetcher";
import { toast } from "sonner";

const RegisterPage: FC = () => {
  const t = useTranslations("Login");

  const formSchema = z
    .object({
      email: z.string().email({
        message: t("emailErrorMessage"),
      }),
      username: z.string().min(4, {
        message: t("emailErrorMessage"),
      }),
      password: z.string().min(6, {
        message: t("passwordErrorMessage"),
      }),
      confirm_password: z.string().min(6, {
        message: t("confirmPasswordErrorMessage"),
      }),
    })
    .refine((data) => data.password === data.confirm_password, {
      message: t("confirmPasswordNotMatchErrorMessage"),
      path: ["confirm_password"], // 把错误指到 confirmPassword 字段上
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      confirm_password: "",
    },
  });

  const handleRegister = async (data: z.infer<typeof formSchema>) => {
    const response = await post<
      { data: unknown },
      { email: string; username: string }
    >("/user/register/", data);
    return response.data;
  };

  const mutation = useMutation({
    mutationFn: handleRegister,
    onSuccess: (data) => {
      form.reset();
      toast.success(t("signUpSuccess"));
    },
    onError: (error) => {
      toast.error(t("signUpError"));
      console.error("Error creating user:", error);
    },
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    mutation.mutate(data);
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-8 w-72"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("email")}</FormLabel>
                <FormControl>
                  <Input required {...field} />
                </FormControl>
                <FormDescription>{t("emailDescription")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("username")}</FormLabel>
                <FormControl>
                  <Input required {...field} />
                </FormControl>
                <FormDescription>{t("usernameDescription")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("password")}</FormLabel>
                <FormControl>
                  <PasswordInput {...field} required />
                </FormControl>
                <FormDescription>{t("passwordDescription")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirm_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("confirmPassword")}</FormLabel>
                <FormControl>
                  <PasswordInput {...field} required />
                </FormControl>
                <FormDescription>
                  {t("confirmPasswordDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">{t("signUp")}</Button>
        </form>
      </Form>
    </>
  );
};

export default RegisterPage;
