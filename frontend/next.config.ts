import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const config: NextConfig = { output: "standalone", turbopack: {} };

export default withNextIntl(config);
