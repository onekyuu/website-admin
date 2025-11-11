import React, { FC, useEffect, useRef, useState } from "react";
import { ControllerRenderProps, useForm } from "react-hook-form";
import { z } from "zod";
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
import { del, post } from "@/lib/fetcher";
import { Button } from "./ui/button";
import { ImageIcon, Plus, Trash2, Upload, X } from "lucide-react";
import Image from "next/image";
import { Skill } from "@/app/(main)/[locale]/projects/skills/types";
import { MultiSelectCheckbox, Option } from "./ui/multi-select-checkbox";
import MarkdownEditor from "./MarkdownEditor";
import { NewProjectData } from "@/app/(main)/[locale]/projects/types";
import { Switch } from "./ui/switch";
import { useAuthStore } from "@/lib/stores/auth";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import InputList from "./InputList";

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
  const userPermissions = useAuthStore(
    (state) => state.allUserData,
  )?.permissions;
  const skillOptions: Option[] = skills.map((skill) => ({
    value: skill.id.toString(),
    label: skill.name,
  }));
  const infoMaxItems = 4;

  const formSchema = z.object({
    title: z.string({
      required_error: t("titleErrorMessage"),
    }),
    subtitle_start: z.string().optional(),
    subtitle_end: z.string().optional(),
    summary: z.string().optional(),
    tech_summary: z.string().optional(),
    introduction: z.string().optional(),
    challenges: z.array(z.string()).optional(),
    solutions: z.string().optional(),
    what_i_did: z.array(z.string()).optional(),
    description: z.string(),
    images: z.array(z.string()),
    detail_images: z.array(z.string()).optional(),
    skill_ids: z.array(z.number()),
    is_featured: z.boolean(),
    info: z.array(z.string()).max(4, t("infoMaxLength")),
    need_ai_generate: z.boolean(),
    extra_info: z
      .record(z.union([z.string(), z.array(z.string()), z.record(z.string())]))
      .optional(),
    github_url: z.string().url().optional(),
    live_demo_url: z.string().url().optional(),
    involved_areas: z.string().optional(),
    tools: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      subtitle_start: initialData?.subtitle_start || "",
      subtitle_end: initialData?.subtitle_end || "",
      summary: initialData?.summary || "",
      tech_summary: initialData?.tech_summary || "",
      introduction: initialData?.introduction || "",
      challenges: initialData?.challenges || [],
      solutions: initialData?.solutions || "",
      what_i_did: initialData?.what_i_did || [],
      description: initialData?.description || "",
      images: initialData?.images || [],
      detail_images: initialData?.detail_images || [],
      skill_ids: initialData?.skill_ids || [],
      is_featured: initialData?.is_featured || false,
      info: initialData?.info || [],
      need_ai_generate: initialData?.need_ai_generate || false,
      extra_info: initialData?.extra_info || {},
      github_url: initialData?.github_url || "",
      live_demo_url: initialData?.live_demo_url || "",
      involved_areas: initialData?.involved_areas || "",
      tools: initialData?.tools || "",
    },
  });

  const uploadImageToOSS = async (file: File): Promise<string> => {
    if (userPermissions?.is_guest) {
      throw new Error("Guest users are not allowed to upload images.");
    }
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
    if (userPermissions?.is_guest) {
      throw new Error("Guest users are not allowed to delete images.");
    }
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
    field: ControllerRenderProps<
      z.infer<typeof formSchema>,
      "images" | "detail_images"
    >,
    file: File,
  ) => {
    if (!field.value) {
      toast.error("Image field is not initialized");
      return;
    }
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
    field: ControllerRenderProps<
      z.infer<typeof formSchema>,
      "images" | "detail_images"
    >,
    index: number,
  ) => {
    if (!field.value) {
      toast.error("Image field is not initialized");
      return;
    }
    const imageUrl = field.value[index];
    try {
      await deleteImageFromOSS(imageUrl);
      const updatedImages = field.value.filter((_, i) => i !== index);
      field.onChange(updatedImages);
    } catch (error) {
      console.error("Failed to delete image:", error);
      alert("Failed to delete image from OSS");
    }
  };

  const handleAddInputItem = (
    field: ControllerRenderProps<
      z.infer<typeof formSchema>,
      "info" | "challenges" | "what_i_did"
    >,
    maxItems?: number,
  ) => {
    if (maxItems) {
      if (field.value && field.value.length < maxItems) {
        field.onChange([...field.value, ""]);
      }
    } else {
      if (field.value) {
        field.onChange([...field.value, ""]);
      }
    }
  };

  const handleRemoveInputItem = (
    field: ControllerRenderProps<
      z.infer<typeof formSchema>,
      "info" | "challenges" | "what_i_did"
    >,
    index: number,
  ) => {
    const updatedInfo = field.value?.filter((_, i) => i !== index);
    field.onChange(updatedInfo);
  };

  const handleChangeInputItem = (
    field: ControllerRenderProps<
      z.infer<typeof formSchema>,
      "info" | "challenges" | "what_i_did"
    >,
    index: number,
    value: string,
  ) => {
    if (!field.value) return;
    const updatedInfo = [...field.value];
    updatedInfo[index] = value;
    field.onChange(updatedInfo);
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
          <div className="flex gap-6">
            <FormField
              control={form.control}
              name="is_featured"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormLabel className="mb-0">{t("isFeatured")}</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="need_ai_generate"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormLabel className="mb-0">{t("needAiGenerate")}</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="github_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("githubURL")}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t("githubURLPlaceholder")} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="live_demo_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("liveDemoURL")}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t("liveDemoURLPlaceholder")} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="subtitle_start"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("subtitleStart")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("subtitleStartPlaceholder")}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="subtitle_end"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("subtitleEnd")}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t("subtitleEndPlaceholder")} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="summary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("summary")}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t("summaryPlaceholder")} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="info"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("info")}</FormLabel>
                <FormControl>
                  <InputList
                    field={field}
                    placeholder={t("infoPlaceholder")}
                    addText={t("addInfo")}
                    onAdd={(maxItems) => handleAddInputItem(field, maxItems)}
                    onChange={(index, value) =>
                      handleChangeInputItem(field, index, value)
                    }
                    onRemove={(index) => handleRemoveInputItem(field, index)}
                    maxItems={infoMaxItems}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tech_summary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("techSummary")}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t("techSummaryPlaceholder")} />
                </FormControl>
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
          <FormField
            control={form.control}
            name="involved_areas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("involvedAreas")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("involvedAreasPlaceholder")}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tools"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("tools")}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t("toolsPlaceholder")} />
                </FormControl>
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
          <div className="grid grid-cols-4 items-center gap-4">
            <FormField
              control={form.control}
              name="detail_images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("detailImages")}</FormLabel>
                  <FormControl>
                    <ImageUploadSection
                      images={field.value || []}
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
            name="introduction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("introduction")}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={t("introductionPlaceholder")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="challenges"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("challenges")}</FormLabel>
                <FormControl>
                  <InputList
                    field={field}
                    placeholder={t("infoPlaceholder")}
                    addText={t("addInfo")}
                    onAdd={() => handleAddInputItem(field)}
                    onChange={(index, value) =>
                      handleChangeInputItem(field, index, value)
                    }
                    onRemove={(index) => handleRemoveInputItem(field, index)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="solutions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("solutions")}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={t("solutionsPlaceholder")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="what_i_did"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("whatIDid")}</FormLabel>
                <FormControl>
                  <InputList
                    field={field}
                    placeholder={t("infoPlaceholder")}
                    addText={t("addInfo")}
                    onAdd={() => handleAddInputItem(field)}
                    onChange={(index, value) =>
                      handleChangeInputItem(field, index, value)
                    }
                    onRemove={(index) => handleRemoveInputItem(field, index)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
