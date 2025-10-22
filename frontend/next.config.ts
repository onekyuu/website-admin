import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const config: NextConfig = {
  output: "standalone",
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "onekyuu-blog.oss-cn-shanghai.aliyuncs.com",
      },
      {
        protocol: "https",
        hostname: "onekyuu-blog.oss-cn-shanghai.aliyuncs.com",
        port: "",
        pathname: "/uploads/**",
        search: "",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default withNextIntl(config);
