import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const config: NextConfig = {
  output: "standalone",
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "onekyuu-blog.oss-cn-shanghai.aliyuncs.com",
        port: "",
        pathname: "/uploads/**",
        search: "",
      },
    ],
  },
};

export default withNextIntl(config);
