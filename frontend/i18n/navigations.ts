import { routing } from "@/i18n/config";
import { createNavigation } from "next-intl/navigation";
export const locales = ["en", "zh", "ja"];
export const localePrefix = "as-needed";
export const defaultLocale = "en";
export const localeItems = [
  { name: "English", code: "en", iso: "en-US", dir: "ltr" },
  { name: "中文", code: "zh", iso: "zh-CN", dir: "ltr" },
  { name: "日本語", code: "ja", iso: "ja-JP", dir: "ltr" },
];

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
