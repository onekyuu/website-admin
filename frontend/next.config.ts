import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const config: NextConfig = {
  output: "standalone",
  turbopack: {},
  images: {
    // 添加 OSS 域名到白名单
    domains: ["onekyuu-blog.oss-cn-shanghai.aliyuncs.com"],
    remotePatterns: [
      new URL("https://onekyuu-blog.oss-cn-shanghai.aliyuncs.com"),
    ],
  },
};

export default withNextIntl(config);
