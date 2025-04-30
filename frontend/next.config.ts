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
        port: "",
        pathname: "/uploads/**",
        search: "",
      },
    ],
  },
};

export default withNextIntl(config);
