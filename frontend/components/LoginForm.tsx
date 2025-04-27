"use client";

import { FC } from "react";
import { Button } from "./ui/button";
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
import { PasswordInput } from "./PasswordInput";

interface LoginFormProps {
  onSubmit: ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => Promise<void>;
}
const LoginForm: FC<LoginFormProps> = ({ onSubmit }) => {
  const t = useTranslations("Login");

  const formSchema = z.object({
    email: z.string().email({
      message: t("emailErrorMessage"),
    }),
    password: z.string().min(6, {
      message: t("passwordErrorMessage"),
    }),
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      await onSubmit(data);
      form.reset();
    } catch (error) {
      throw error;
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("email")}</FormLabel>
                <FormControl>
                  <Input
                    required
                    className={"w-72"}
                    {...field}
                    placeholder={t("emailPlaceholder")}
                  />
                </FormControl>
                <FormDescription>{t("emailDescription")}</FormDescription>
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
                  <PasswordInput className={"w-72"} {...field} required />
                </FormControl>
                <FormDescription>{t("passwordDescription")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">{t("signIn")}</Button>
        </form>
      </Form>
    </>
  );
};

export default LoginForm;
