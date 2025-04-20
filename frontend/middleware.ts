import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  locales: ["zh", "en", "ja"],
  defaultLocale: "zh",
  localeDetection: true,
});

export const config = {
  matcher: ["/", "/(zh|en|ja)/:path*"],
};
