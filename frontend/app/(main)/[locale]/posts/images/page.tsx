"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import { Loader2, Trash2, Search, Image as ImageIcon } from "lucide-react";
import { useDeleteOSSImage, useDeleteOSSImages } from "@/hooks/useOSSDelete";
import { get } from "@/lib/fetcher";
import { PaginationState } from "@tanstack/react-table";
import dayjs from "dayjs";
import { useAuthStore } from "@/lib/stores/auth";

interface OSSImage {
  name: string;
  url: string;
  size: number;
  lastModified: string;
  directoryName: string;
  directory: string;
}

interface ListOSSImagesResponse {
  results: OSSImage[];
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export default function ImagesPage() {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const userPermissions = useAuthStore(
    (state) => state.allUserData,
  )?.permissions;

  const {
    data: ossImagesList,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "list-oss-images",
      pagination.pageIndex,
      pagination.pageSize,
      searchQuery,
    ],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(pagination.pageIndex + 1),
        page_size: String(pagination.pageSize),
      });
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      return get<ListOSSImagesResponse>(`/oss/images/list/?${params}`);
    },
  });

  const deleteMutation = useDeleteOSSImage();
  const batchDeleteMutation = useDeleteOSSImages();

  // 处理删除确认
  const handleDeleteClick = (imageUrl: string) => {
    setImageToDelete(imageUrl);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (imageToDelete) {
      deleteMutation.mutate(imageToDelete, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setImageToDelete(null);
          queryClient.invalidateQueries({ queryKey: ["list-oss-images"] });
        },
      });
    }
  };

  // 处理批量删除
  const handleBatchDelete = () => {
    if (selectedImages.size === 0) return;
    batchDeleteMutation.mutate(Array.from(selectedImages), {
      onSuccess: () => {
        setSelectedImages(new Set());
        queryClient.invalidateQueries({ queryKey: ["list-oss-images"] });
      },
    });
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

  // 处理分页
  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({
      ...prev,
      pageIndex: newPage,
    }));
    setSelectedImages(new Set()); // 清空选中状态
  };

  // 生成分页数组
  const generatePaginationArray = () => {
    const totalPages = ossImagesList?.total_pages || 0;
    const currentPage = pagination.pageIndex;
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      // 总页数小于等于7，显示所有页码
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 总页数大于7，显示省略号
      if (currentPage < 3) {
        // 当前页在前面
        for (let i = 0; i < 5; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages - 1);
      } else if (currentPage > totalPages - 4) {
        // 当前页在后面
        pages.push(0);
        pages.push("ellipsis");
        for (let i = totalPages - 5; i < totalPages; i++) {
          pages.push(i);
        }
      } else {
        // 当前页在中间
        pages.push(0);
        pages.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages - 1);
      }
    }

    return pages;
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
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 })); // 搜索时重置到第一页
            }}
            className="pl-10"
          />
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
              disabled={
                batchDeleteMutation.isPending || userPermissions?.is_guest
              }
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
        {t("Images.totalImages")}: {ossImagesList?.count || 0}
        {searchQuery && ` (${t("Images.filtered")})`}
        {ossImagesList &&
          ` · 第 ${ossImagesList.page} / ${ossImagesList.total_pages} 页`}
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
              queryClient.invalidateQueries({ queryKey: ["list-oss-images"] })
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
          <>
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
                        unoptimized
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
                    <p className="text-xs text-muted-foreground mt-1">
                      {image.directoryName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dayjs(image.lastModified).format("YYYY-MM-DD HH:mm:ss")}
                    </p>
                  </CardContent>
                  <CardFooter className="p-3 pt-0 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs cursor-pointer"
                      disabled={userPermissions?.is_guest}
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
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(image.url);
                      }}
                      disabled={
                        deleteMutation.isPending || userPermissions?.is_guest
                      }
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* 分页组件 */}
            {ossImagesList.total_pages > 1 && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          pagination.pageIndex > 0 &&
                          handlePageChange(pagination.pageIndex - 1)
                        }
                        className={
                          pagination.pageIndex === 0
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {generatePaginationArray().map((page, index) =>
                      page === "ellipsis" ? (
                        <PaginationItem key={`ellipsis-${index}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handlePageChange(page as number)}
                            isActive={pagination.pageIndex === page}
                            className="cursor-pointer"
                          >
                            {(page as number) + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ),
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          pagination.pageIndex <
                            ossImagesList.total_pages - 1 &&
                          handlePageChange(pagination.pageIndex + 1)
                        }
                        className={
                          pagination.pageIndex >= ossImagesList.total_pages - 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}

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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-amber-50"
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
