import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteFromOSS, deleteMultipleFromOSS } from "@/lib/oss-delete";
import { toast } from "sonner";

export function useDeleteOSSImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileUrl: string) => deleteFromOSS(fileUrl),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || "图片删除成功");
        queryClient.invalidateQueries({ queryKey: ["oss-images"] });
      } else {
        toast.error(data.error || "图片删除失败");
      }
    },
    onError: (error: Error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });
}

export function useDeleteOSSImages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileUrls: string[]) => deleteMultipleFromOSS(fileUrls),
    onSuccess: (data) => {
      if (data.success) {
        if (data.totalFailed && data.totalFailed > 0) {
          // 部分成功
          toast.warning(
            `成功删除 ${data.totalDeleted} 张图片，${data.totalFailed} 张失败`,
            {
              description: data.failed?.map((f) => f.key).join(", "),
            },
          );
        } else {
          // 全部成功
          toast.success(`成功删除 ${data.totalDeleted} 张图片`);
        }
        queryClient.invalidateQueries({ queryKey: ["oss-images"] });
      } else {
        toast.error(data.error || "批量删除失败");
      }
    },
    onError: (error: Error) => {
      toast.error(`批量删除失败: ${error.message}`);
    },
  });
}
