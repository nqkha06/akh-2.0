"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import {
  defaultLocale,
  localeCookieName,
  locales,
  type AppLocale,
} from "@/i18n/config";

export function LanguageSwitcher() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("Common");
  const [isPending, startTransition] = useTransition();

  const changeLocale = (nextLocale: AppLocale) => {
    if (nextLocale === locale) {
      return;
    }

    document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => {
      window.location.reload();
    });
  };

  return (
    <label className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-xs font-bold text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.10)] backdrop-blur-md">
      <span className="sr-only">{t("language")}</span>
      <select
        value={locale || defaultLocale}
        disabled={isPending}
        onChange={(event) => changeLocale(event.target.value as AppLocale)}
        className="bg-transparent outline-none disabled:cursor-wait disabled:opacity-60"
      >
        {locales.map((option) => (
          <option key={option} value={option}>
            {option === "vi" ? t("vietnamese") : t("english")}
          </option>
        ))}
      </select>
    </label>
  );
}
