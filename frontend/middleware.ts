import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware({
  locales: ["zh", "en", "ja"],
  defaultLocale: "zh",
  localeDetection: true,
});

export const locales = ["en", "zh", "ja"] as const;

const publicPages = ["/login"];

export function middleware(request: NextRequest) {
  const publicPathnameRegex = RegExp(
    `^(/(${locales.join("|")}))?(${publicPages
      .flatMap((p) => (p === "/" ? ["", "/"] : p))
      .join("|")})/?$`,
    "i",
  );
  const isPublicPage = publicPathnameRegex.test(request.nextUrl.pathname);

  const { pathname } = request.nextUrl;
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
