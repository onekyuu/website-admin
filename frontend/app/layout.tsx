import type { Metadata } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/noto-sans-jp";
import "@fontsource-variable/noto-sans-sc";
import "@fontsource-variable/roboto";
import "./globals.css";

export const metadata: Metadata = {
  title: "Onekyuu Website Admin",
  description: "Admin panel for the website",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
