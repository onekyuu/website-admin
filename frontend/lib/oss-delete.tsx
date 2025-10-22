import OSS from "ali-oss";
import { API_BASE_URL } from "./constants";

export async function deleteFromOSS(fileUrl: string): Promise<boolean> {
  const credentials = await fetch(`${API_BASE_URL}/oss/credentials/`).then(
    (res) => res.json(),
  );
  try {
    const client = new OSS({
      region: credentials.Region,
      bucket: credentials.Bucket,
      accessKeyId: credentials.AccessKeyId,
      accessKeySecret: credentials.AccessKeySecret,
      stsToken: credentials.SecurityToken,
      refreshSTSToken: async () => {
        const newCredentials = await fetch(
          `${API_BASE_URL}/oss/credentials/`,
        ).then((res) => res.json());
        return {
          accessKeyId: newCredentials.AccessKeyId,
          accessKeySecret: newCredentials.AccessKeySecret,
          stsToken: newCredentials.SecurityToken,
        };
      },
    });

    // 从完整 URL 中提取文件路径
    // 例如: http://onekyuu-blog.oss-cn-shanghai.aliyuncs.com/uploads/1761117350395-yk932r/DSC07530.jpeg
    // 提取: uploads/1761117350395-yk932r/DSC07530.jpeg
    const url = new URL(fileUrl);
    const objectName = url.pathname.substring(1); // 移除开头的 '/'

    // 删除文件
    await client.delete(objectName);

    console.log(`Successfully deleted: ${objectName}`);
    return true;
  } catch (error) {
    console.error("Failed to delete from OSS:", error);
    return false;
  }
}

// 批量删除
export async function deleteMultipleFromOSS(
  fileUrls: string[],
): Promise<boolean> {
  const credentials = await fetch(`${API_BASE_URL}/oss/credentials/`).then(
    (res) => res.json(),
  );
  try {
    const client = new OSS({
      region: credentials.Region,
      bucket: credentials.Bucket,
      accessKeyId: credentials.AccessKeyId,
      accessKeySecret: credentials.AccessKeySecret,
      stsToken: credentials.SecurityToken,
      refreshSTSToken: async () => {
        const newCredentials = await fetch(
          `${API_BASE_URL}/oss/credentials/`,
        ).then((res) => res.json());
        return {
          accessKeyId: newCredentials.AccessKeyId,
          accessKeySecret: newCredentials.AccessKeySecret,
          stsToken: newCredentials.SecurityToken,
        };
      },
    });

    const objectNames = fileUrls.map((fileUrl) => {
      const url = new URL(fileUrl);
      return url.pathname.substring(1);
    });

    // 批量删除（最多 1000 个文件）
    await client.deleteMulti(objectNames);

    console.log(`Successfully deleted ${objectNames.length} files`);
    return true;
  } catch (error) {
    console.error("Failed to delete multiple files from OSS:", error);
    return false;
  }
}
