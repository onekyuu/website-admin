import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { ReactNode, Suspense } from "react";
import { routing } from "@/i18n/config";
import { Roboto, Noto_Sans_JP, Noto_Sans_SC } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { ReactQueryProvider } from "@/lib/react-query";
import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Layout from "@/components/Layout";
import { DelayedFallback } from "@/components/DelayedFallback";
import Loading from "./loading";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
});

export default async function LocaleLayout({ children, params }: Props) {
  // Ensure that the incoming `locale` is valid
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const fonts: { [K: string]: string } = {
    en: roboto.className,
    zh: notoSansSC.className,
    ja: notoSansJP.className,
  };

  return (
    <html lang={locale}>
      <body className={cn(fonts[locale])}>
        <ReactQueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <NextIntlClientProvider>
              <SidebarProvider>
                <AppSidebar />
                <Layout>
                  <Suspense
                    fallback={
                      <DelayedFallback delay={100}>
                        <Loading />
                      </DelayedFallback>
                    }
                  >
                    {children}
                  </Suspense>
                </Layout>
              </SidebarProvider>
            </NextIntlClientProvider>
          </ThemeProvider>
        </ReactQueryProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
