"use client";

import React, { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Loader2,
  Trash2,
  Upload,
  X,
  Search,
  Image as ImageIcon,
} from "lucide-react";
import { uploadToOSS } from "@/lib/oss-upload";
import { deleteFromOSS } from "@/lib/oss-delete";
import OSS from "ali-oss";
import { API_BASE_URL } from "@/lib/constants";
import { get } from "@/lib/fetcher";
import { PaginationState } from "@tanstack/react-table";

interface OSSImage {
  name: string;
  url: string;
  size: number;
  lastModified: string;
}

interface ListOSSImagesResponse {
  results: OSSImage[];
  count: number;
  page: number;
  page_size: number;
}

export default function ImagesPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const {
    data: ossImagesList,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["list-oss-images"],
    queryFn: () =>
      get<ListOSSImagesResponse>(
        `/oss/images/list/?page=${pagination.pageIndex + 1}`,
      ),
  });

  // 删除单个图片
  const deleteMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      const success = await deleteFromOSS(imageUrl);
      if (!success) {
        throw new Error("Failed to delete image");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["oss-images"] });
      toast.success(t("Images.deleteSuccess"));
      setDeleteDialogOpen(false);
      setImageToDelete(null);
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast.error(t("Images.deleteFailed"));
    },
  });

  // 批量删除
  const batchDeleteMutation = useMutation({
    mutationFn: async (imageUrls: string[]) => {
      const results = await Promise.allSettled(
        imageUrls.map((url) => deleteFromOSS(url)),
      );
      const failedCount = results.filter((r) => r.status === "rejected").length;
      if (failedCount > 0) {
        throw new Error(`Failed to delete ${failedCount} images`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["oss-images"] });
      toast.success(t("Images.batchDeleteSuccess"));
      setSelectedImages(new Set());
    },
    onError: (error) => {
      console.error("Batch delete error:", error);
      toast.error(t("Images.batchDeleteFailed"));
    },
  });

  // 上传图片
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      // 验证文件类型
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name}: ${t("Images.invalidType")}`);
        return null;
      }

      // 验证文件大小 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: ${t("Images.tooLarge")}`);
        return null;
      }

      try {
        const url = await uploadToOSS(file);
        return url;
      } catch (error) {
        toast.error(`${file.name}: ${t("Images.uploadFailed")}`);
        return null;
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      const successCount = results.filter((r) => r !== null).length;

      if (successCount > 0) {
        toast.success(t("Images.uploadSuccess", { count: successCount }));
        queryClient.invalidateQueries({ queryKey: ["oss-images"] });
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // 处理删除确认
  const handleDeleteClick = (imageUrl: string) => {
    setImageToDelete(imageUrl);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (imageToDelete) {
      deleteMutation.mutate(imageToDelete);
    }
  };

  // 处理批量删除
  const handleBatchDelete = () => {
    if (selectedImages.size === 0) return;
    batchDeleteMutation.mutate(Array.from(selectedImages));
  };

  // 切换选中状态
  const toggleImageSelection = (imageUrl: string) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(imageUrl)) {
      newSelected.delete(imageUrl);
    } else {
      newSelected.add(imageUrl);
    }
    setSelectedImages(newSelected);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedImages.size === ossImagesList?.results.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(ossImagesList?.results.map((img) => img.url)));
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // 复制图片 URL
  const copyImageUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success(t("Images.urlCopied"));
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("Images.title")}</h1>
        <p className="text-muted-foreground">{t("Images.description")}</p>
      </div>

      {/* 操作栏 */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* 搜索 */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={t("Images.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* 上传按钮 */}
        <div>
          <Input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleUpload(e.target.files)}
            className="hidden"
            id="upload-images"
            disabled={isUploading}
          />
          <label htmlFor="upload-images">
            <Button asChild disabled={isUploading}>
              <span>
                {isUploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {t("Images.upload")}
              </span>
            </Button>
          </label>
        </div>

        {/* 批量操作 */}
        {selectedImages.size > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={toggleSelectAll}>
              {selectedImages.size === ossImagesList?.results.length
                ? t("Images.deselectAll")
                : t("Images.selectAll")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleBatchDelete}
              disabled={batchDeleteMutation.isPending}
            >
              {batchDeleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              {t("Images.deleteSelected")} ({selectedImages.size})
            </Button>
          </div>
        )}
      </div>

      {/* 统计信息 */}
      <div className="mb-6 text-sm text-muted-foreground">
        {t("Images.totalImages")}: {ossImagesList?.results.length}
        {searchQuery && ` (${t("Images.filtered")})`}
      </div>

      {/* 加载状态 */}
      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div className="text-center py-20">
          <p className="text-destructive">{t("Images.loadError")}</p>
          <Button
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["oss-images"] })
            }
            className="mt-4"
          >
            {t("Images.retry")}
          </Button>
        </div>
      )}

      {/* 空状态 */}
      {!isLoading && !error && ossImagesList?.results.length === 0 && (
        <div className="text-center py-20">
          <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchQuery ? t("Images.noResults") : t("Images.noImages")}
          </p>
        </div>
      )}

      {/* 图片网格 */}
      {!isLoading &&
        !error &&
        ossImagesList?.results &&
        ossImagesList.results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {ossImagesList?.results.map((image) => (
              <Card
                key={image.url}
                className={`overflow-hidden cursor-pointer transition-all ${
                  selectedImages.has(image.url)
                    ? "ring-2 ring-primary"
                    : "hover:shadow-lg"
                }`}
                onClick={() => toggleImageSelection(image.url)}
              >
                <CardHeader className="p-0">
                  <div className="relative aspect-square bg-muted">
                    <Image
                      src={image.url}
                      alt={image.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                    {selectedImages.has(image.url) && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          ✓
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <p
                    className="text-xs font-medium truncate"
                    title={image.name}
                  >
                    {image.name.split("/").pop()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatFileSize(image.size)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {image.lastModified}
                  </p>
                </CardContent>
                <CardFooter className="p-3 pt-0 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyImageUrl(image.url);
                    }}
                  >
                    {t("Images.copy")}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(image.url);
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("Images.deleteConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("Images.deleteConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Images.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {t("Images.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
