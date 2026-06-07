import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { ReactNode } from "react";
import { routing } from "@/i18n/config";
import { ThemeProvider } from "@/components/theme-provider";
import { ReactQueryProvider } from "@/lib/react-query";
import { Toaster } from "@/components/ui/sonner";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  // Ensure that the incoming `locale` is valid
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const fonts: { [K: string]: string } = {
    en: "font-roboto",
    zh: "font-noto-sans-sc",
    ja: "font-noto-sans-jp",
  };

  return (
    <html lang={locale}>
      <body className={fonts[locale]}>
        <ReactQueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <NextIntlClientProvider>{children}</NextIntlClientProvider>
          </ThemeProvider>
        </ReactQueryProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
