"use client";
import { FC } from "react";
import { useLocale } from "next-intl";
import { localeItems, usePathname, useRouter } from "@/i18n/navigations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LocaleSwitcher: FC = () => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (value: string) => {
    router.push(pathname, { locale: value });
  };

  return (
    <div>
      <Select defaultValue={locale} value={locale} onValueChange={handleChange}>
        <SelectTrigger className="w-[100px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {localeItems.map((item) => {
            return (
              <SelectItem key={item.code} value={item.code}>
                {item.name}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LocaleSwitcher;
