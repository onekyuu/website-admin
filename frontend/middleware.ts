import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

const SUPPORTED_LOCALES: string[] = ["zh", "en", "ja"];

const intlMiddleware = createMiddleware({
  locales: SUPPORTED_LOCALES,
  defaultLocale: "en",
  localeDetection: true,
});

const publicPages = ["/login"];

function detectLocaleFromAcceptLanguage(acceptLanguage: string | null): string {
  if (!acceptLanguage) return "zh"; // 默认语言
  const language = acceptLanguage.split(",")[0].split("-")[0]; // 提取主语言部分
  return SUPPORTED_LOCALES.includes(language) ? language : "en";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/") {
    const acceptLanguage = request.headers.get("accept-language");
    const locale = detectLocaleFromAcceptLanguage(acceptLanguage);
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }
  const publicPathnameRegex = RegExp(
    `^(/(${SUPPORTED_LOCALES.join("|")}))?(${publicPages
      .flatMap((p) => (p === "/" ? ["", "/"] : p))
      .join("|")})/?$`,
    "i",
  );
  const isPublicPage = publicPathnameRegex.test(request.nextUrl.pathname);

  const localeMatch = pathname.match(/^\/(zh|en|ja)(\/|$)/);
  const localePrefix = localeMatch?.[0] || "";
  if (isPublicPage) {
    return intlMiddleware(request);
  }
  // check access token
  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    const loginUrl = new URL(`${localePrefix}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // loged in
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/", "/(zh|en|ja)/:path*"],
};
