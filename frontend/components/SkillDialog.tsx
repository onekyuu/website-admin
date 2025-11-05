"use client";

import { SkillType } from "@/lib/constants";
import { useAuthStore } from "@/lib/stores/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import React, { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { toast } from "sonner";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { post } from "@/lib/fetcher";
import { deleteFromOSS } from "@/lib/oss-delete";

interface SkillDialogProps {
  mode: "create" | "edit";
  skillToEdit?: {
    id: number;
    name: string;
    image_url: string;
    type: SkillType;
  };
  handleSubmit: (data: {
    id?: number;
    name: string;
    image_url: string;
    type: SkillType;
  }) => Promise<void>;
}

const SkillDialog: FC<SkillDialogProps> = ({
  mode,
  skillToEdit,
  handleSubmit,
}) => {
  const t = useTranslations("Project");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const isEditMode = mode === "edit";
  const dialogOpen = isEditMode ? editOpen : createOpen;
  const setDialogOpen = isEditMode ? setEditOpen : setCreateOpen;
  const userPermissions = useAuthStore(
    (state) => state.allUserData,
  )?.permissions;

  const formSchema = z.object({
    name: z.string({
      required_error: t("Skill.nameErrorMessage"),
    }),
    image_url: z.string(),
    type: z.nativeEnum(SkillType),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      image_url: "",
      type: undefined,
    },
  });

  useEffect(() => {
    if (isEditMode && skillToEdit) {
      form.reset({
        name: skillToEdit.name,
        image_url: skillToEdit.image_url || "",
        type: skillToEdit.type,
      });
    } else if (!isEditMode) {
      form.reset({
        name: "",
        image_url: "",
        type: undefined,
      });
    }
  }, [isEditMode, skillToEdit, form]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (isEditMode && skillToEdit) {
      await handleSubmit({ ...data, id: skillToEdit.id });
    } else {
      await handleSubmit(data);
    }
    form.reset();
    setDialogOpen(false);
  };

  const uploadImageToOSS = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("directory", "uploads/projects/skills");

    const response = await post<{ data: { url: string } }, FormData>(
      "/oss/images/upload/",
      formData,
    );
    return response.data.url;
  };

  const handleDeleteImage = async () => {
    const currentImage = form.getValues("image_url");
    if (!currentImage) return;
    try {
      const success = await deleteFromOSS(currentImage);
      if (success) {
        form.setValue("image_url", "");
        toast.success(t("Post.imageDeleteSuccess"));
      } else {
        toast.error(t("Post.imageDeleteFailed"));
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(t("Post.imageDeleteFailed"));
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {isEditMode ? (
        <DialogTrigger asChild>
          <Button variant="outline">{t("Skill.edit")}</Button>
        </DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="outline">{t("Skill.create")}</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? t("Skill.edit") : t("Skill.create")}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? t("Skill.editDescription")
              : t("Skill.createDescription")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Skill.name")}</FormLabel>
                  <FormControl>
                    <Input required {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Skill.image")}</FormLabel>
                  <div className="space-y-2">
                    {field.value && (
                      <div className="w-24 h-24">
                        <Image
                          width={96}
                          height={96}
                          src={field.value}
                          alt="Preview"
                          className="rounded-md object-cover h-full"
                        />
                      </div>
                    )}
                    <FormControl>
                      <Input
                        id="picture"
                        type="file"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const imageUrl = await uploadImageToOSS(file);
                              field.onChange(imageUrl);
                              toast.success(t("Skill.imageUploadSuccess"));
                            } catch (error) {
                              console.error("Image upload failed:", error);
                              toast.error(t("Skill.imageUploadError"));
                            }
                          }
                        }}
                        placeholder="Upload an image"
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Skill.type")}</FormLabel>
                  <FormControl>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t("Skill.selectSkill")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>{t("Skill.type")}</SelectLabel>
                          {Object.values(SkillType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                {t("Skill.cancel")}
              </Button>
              <Button type="submit" disabled={userPermissions?.is_guest}>
                {isEditMode ? t("Skill.update") : t("Skill.submit")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SkillDialog;
