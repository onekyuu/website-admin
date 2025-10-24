import { del } from "./fetcher";

/**
 * 从完整 URL 中提取对象键
 * 例如: http://onekyuu-blog.oss-cn-shanghai.aliyuncs.com/uploads/1761117350395-yk932r/DSC07530.jpeg
 * 提取: uploads/1761117350395-yk932r/DSC07530.jpeg
 */
function extractObjectKey(fileUrl: string): string {
  const url = new URL(fileUrl);
  return url.pathname.substring(1); // 移除开头的 '/'
}

/**
 * 删除单个文件
 */
export async function deleteFromOSS(fileUrl: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const objectKey = extractObjectKey(fileUrl);

    const data = await del<{ message: string; object_key: string }>(
      `/oss/images/delete/`,
      { object_key: objectKey },
    );

    console.log(`Successfully deleted: ${objectKey}`);
    return {
      success: true,
      message: data.message,
    };
  } catch (error) {
    console.error("Failed to delete from OSS:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * 批量删除文件
 */
export async function deleteMultipleFromOSS(fileUrls: string[]): Promise<{
  success: boolean;
  deleted?: string[];
  failed?: Array<{ key: string; error: string }>;
  totalDeleted?: number;
  totalFailed?: number;
  error?: string;
}> {
  try {
    const objectKeys = fileUrls.map(extractObjectKey);

    const data = await del<{
      message: string;
      deleted: string[];
      failed: Array<{ key: string; error: string }>;
      total_requested: number;
      total_deleted: number;
      total_failed: number;
    }>(`/oss/images/delete/batch/`, { object_keys: objectKeys });

    console.log(`Successfully deleted ${data.total_deleted} files`);

    return {
      success: true,
      deleted: data.deleted,
      failed: data.failed,
      totalDeleted: data.total_deleted,
      totalFailed: data.total_failed,
    };
  } catch (error) {
    console.error("Failed to delete multiple files from OSS:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
