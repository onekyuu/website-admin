import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Website Admin",
  description: "Admin panel for the website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
