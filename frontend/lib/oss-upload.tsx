import OSS from "ali-oss";
import { API_BASE_URL } from "./constants";

export async function uploadToOSS(file: File) {
  // 从 Django 后端获取凭证
  const credentials = await fetch(`${API_BASE_URL}/oss/credentials/`).then(
    (res) => res.json(),
  );

  // 初始化 OSS 客户端
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

  // 生成文件名
  const filename = `uploads/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}/${file.name}`;

  // 上传文件
  const result = await client.put(filename, file);
  return result.url;
}
