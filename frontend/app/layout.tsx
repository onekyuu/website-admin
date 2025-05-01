import type { Metadata } from "next";
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
