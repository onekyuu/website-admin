import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { FC, useEffect, useState } from "react";
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
import { uploadToOSS } from "@/lib/oss-upload";
import { toast } from "sonner";
import Image from "next/image";
import { useAuthStore } from "@/lib/stores/auth";

export type DialogMode = "create" | "edit";

export interface Category {
  id: number;
  title: string;
  slug: string;
  image: string;
}

const CategoryDialog: FC<{
  mode: DialogMode;
  categoryToEdit?: Category;
  handleSubmit: (
    data: Category | { title: string; image?: string },
  ) => Promise<void>;
}> = ({ mode, categoryToEdit, handleSubmit }) => {
  const t = useTranslations();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const isEditMode = mode === "edit";
  const dialogOpen = isEditMode ? editOpen : createOpen;
  const setDialogOpen = isEditMode ? setEditOpen : setCreateOpen;
  const userPermissions = useAuthStore(
    (state) => state.allUserData,
  )?.permissions;

  const formSchema = z.object({
    title: z.string({
      required_error: t("Post.titleErrorMessage"),
    }),
    image: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      image: "",
    },
  });

  useEffect(() => {
    if (isEditMode && categoryToEdit) {
      form.reset({
        title: categoryToEdit.title,
        image: categoryToEdit.image || "",
      });
    } else if (!isEditMode) {
      form.reset({
        title: "",
        image: "",
      });
    }
  }, [isEditMode, categoryToEdit, form]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (isEditMode && categoryToEdit) {
      // 编辑模式
      await handleSubmit({ ...data, id: categoryToEdit.id });
    } else {
      // 创建模式
      await handleSubmit(data);
    }
    form.reset();
    setDialogOpen(false);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {isEditMode ? (
        <DialogTrigger asChild>
          <Button variant="outline">{t("Category.edit")}</Button>
        </DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="outline">{t("Category.create")}</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? t("Category.edit") : t("Category.create")}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? t("Category.editDescription")
              : t("Category.createDescription")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Category.title")}</FormLabel>
                  <FormControl>
                    <Input required {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Category.image")}</FormLabel>
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
                              const imageUrl = await uploadToOSS(file);
                              field.onChange(imageUrl);
                              toast.success(t("Category.imageUploadSuccess"));
                            } catch (error) {
                              console.error("Image upload failed:", error);
                              toast.error(t("Category.imageUploadError"));
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
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                {t("Category.cancel")}
              </Button>
              <Button type="submit" disabled={userPermissions?.is_guest}>
                {isEditMode ? t("Category.update") : t("Category.submit")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryDialog;
