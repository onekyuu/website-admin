import React, { FC, useEffect, useRef, useState } from "react";
import { ControllerRenderProps, useForm } from "react-hook-form";
import { number, z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { SkillType } from "@/lib/constants";
import { del, post } from "@/lib/fetcher";
import { Button } from "./ui/button";
import { ImageIcon, Upload, X } from "lucide-react";
import Image from "next/image";
import { Skill } from "@/app/(main)/[locale]/projects/skills/types";
import { MultiSelectCheckbox, Option } from "./ui/multi-select-checkbox";
import MarkdownEditor from "./MarkdownEditor";
import { NewProjectData } from "@/app/(main)/[locale]/projects/types";

interface ProjectFormProps {
  skills: Skill[];
  onChange?: (data: NewProjectData) => void;
  mode?: "create" | "edit";
  initialData?: NewProjectData;
}

const ProjectForm: FC<ProjectFormProps> = ({
  skills,
  onChange,
  initialData,
  mode,
}) => {
  const t = useTranslations("Project");
  const [uploadingImage, setUploadingImage] = useState(false);
  const skillOptions: Option[] = skills.map((skill) => ({
    value: skill.id.toString(),
    label: skill.name,
  }));

  const formSchema = z.object({
    title: z.string({
      required_error: t("titleErrorMessage"),
    }),
    description: z.string(),
    images: z.array(z.string()),
    skill_ids: z.array(z.number()),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      images: initialData?.images || [],
      skill_ids: initialData?.skill_ids || [],
    },
  });

  const uploadImageToOSS = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("directory", "uploads/projects");

    const response = await post<{ data: { url: string } }, FormData>(
      "/oss/images/upload/",
      formData,
    );
    return response.data.url;
  };

  const deleteImageFromOSS = async (imageUrl: string): Promise<void> => {
    try {
      await del("/oss/images/delete/", {
        url: imageUrl,
      });
    } catch (error) {
      console.error("Failed to delete image from OSS:", error);
      throw error;
    }
  };

  const handleAddImage = async (
    field: ControllerRenderProps<z.infer<typeof formSchema>, "images">,
    file: File,
  ) => {
    setUploadingImage(true);
    try {
      const url = await uploadImageToOSS(file);
      field.onChange([...field.value, url]);
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async (
    field: ControllerRenderProps<z.infer<typeof formSchema>, "images">,
    index: number,
  ) => {
    const imageUrl = field.value[index];

    // setDeletingIndex(index);
    try {
      // 先从 OSS 删除
      await deleteImageFromOSS(imageUrl);

      // 删除成功后，从表单中移除
      const updatedImages = field.value.filter((_, i) => i !== index);
      field.onChange(updatedImages);
    } catch (error) {
      console.error("Failed to delete image:", error);
      alert("Failed to delete image from OSS");
    } finally {
      //   setDeletingIndex(null);
    }
  };

  useEffect(() => {
    const subscription = form.watch((values) => {
      onChange?.(values as NewProjectData);
    });
    return () => subscription.unsubscribe();
  }, [form, onChange]);

  return (
    <div>
      <Form {...form}>
        <form className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("title")}</FormLabel>
                <FormControl>
                  <Input
                    required
                    {...field}
                    placeholder={t("titlePlaceholder")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="skill_ids"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("skills")}</FormLabel>
                <FormControl>
                  <MultiSelectCheckbox
                    options={skillOptions}
                    selected={field.value.map(String)}
                    onChange={(values) => field.onChange(values.map(Number))}
                    placeholder={t("selectSkill")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-4 items-center gap-4">
            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("images")}</FormLabel>
                  <FormControl>
                    <ImageUploadSection
                      images={field.value}
                      onAdd={(file) => handleAddImage(field, file)}
                      onRemove={(index) => handleRemoveImage(field, index)}
                      isUploading={uploadingImage}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("description")}</FormLabel>
                <FormControl>
                  <MarkdownEditor
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder={t("descriptionPlaceholder")}
                    minHeight="500px"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
};

export default ProjectForm;

interface ImageUploadSectionProps {
  images: string[];
  onAdd: (file: File) => void;
  onRemove: (index: number) => void;
  isUploading: boolean;
}

const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  images,
  onAdd,
  onRemove,
  isUploading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAdd(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>Uploading...</>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Image
            </>
          )}
        </Button>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group aspect-square">
              <Image
                src={image}
                alt={`Project image ${index + 1}`}
                fill
                className="object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => onRemove(index)}
                className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No images uploaded yet</p>
        </div>
      )}
    </div>
  );
};
