import { API_BASE_URL } from "./constants";

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

    const response = await fetch(`${API_BASE_URL}/oss/images/delete/`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ object_key: objectKey }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.detail || "Delete failed");
    }

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

    const response = await fetch(`${API_BASE_URL}/oss/images/delete/batch/`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ object_keys: objectKeys }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.detail || "Batch delete failed");
    }

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
