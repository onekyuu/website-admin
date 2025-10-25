"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { uploadToOSS } from "@/lib/oss-upload";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Permissions, useAuthStore } from "@/lib/stores/auth";
import { patch } from "@/lib/fetcher";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

interface UserProfile {
  id: number;
  full_name: string;
  email: string;
  avatar: string;
  is_superuser: boolean;
  user: {
    id: number;
    username: string;
    email: string;
  };
  role_name: string | null;
  permissions: Permissions | null;
}

export default function AccountPage() {
  const t = useTranslations("Account");
  const userInfo = useAuthStore((state) => state.allUserData);

  const formSchema = z.object({
    username: z.string().min(2, t("usernameMinLength")),
    avatar: z.string().optional(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: userInfo?.username || "",
      avatar: userInfo?.avatar || "",
    },
  });

  const handleSavePost = async (data: { avatar: string }) => {
    const response = await patch<{ data: UserProfile }, { avatar: string }>(
      `/user/profile/${userInfo?.user_id}/`,
      data,
    );
    return response.data;
  };

  const mutation = useMutation({
    mutationFn: handleSavePost,
    onSuccess: (data) => {
      toast.success(t("updateSuccess"));
      useAuthStore.getState().setUser({
        user_id: data.user.id.toString(),
        is_superuser: data.is_superuser,
        avatar: data.avatar,
        username: data.user.username || null,
        email: data.user.email || null,
        role_name: data.role_name || null,
        permissions: data.permissions || null,
      });
    },
    onError: (error) => {
      toast.error(t("updateFailed"));
      console.error("Error updating:", error);
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!userInfo?.user_id) {
      toast.error(t("userNotFound"));
      return;
    }
    if (!data.avatar) {
      toast.error(t("avatarRequired"));
      return;
    }
    mutation.mutate({
      avatar: data.avatar,
    });
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-6">{t("formTitle")}</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="avatar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("avatar")}</FormLabel>
                <div className="space-y-2 flex items-center">
                  <Avatar className="w-14 h-14 rounded-lg mr-4">
                    <AvatarImage src={field?.value} />
                    <AvatarFallback className="rounded-lg">
                      {userInfo?.username?.slice(0, 3)}
                    </AvatarFallback>
                  </Avatar>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const url = await uploadToOSS(file);
                            field.onChange(url);
                            toast.success(t("avatarUploadSuccess"));
                          } catch (err) {
                            toast.error(t("avatarUploadFailed"));
                          }
                        }
                      }}
                    />
                  </FormControl>
                </div>
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
                  <Input
                    {...field}
                    placeholder={t("usernameInputPlaceholder")}
                    disabled
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">
            {t("save")}
          </Button>
        </form>
      </Form>
    </div>
  );
}
