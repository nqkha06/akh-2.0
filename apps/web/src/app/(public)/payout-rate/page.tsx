import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import "flag-icons/css/flag-icons.min.css";

import { PayoutRatesPage } from "@/components/payout-rates/payout-rates-page";
import { getPublicMenus } from "@/features/admin-menus/api/public-menus.server";
import { getPublicPayoutRates } from "@/features/public-payout-rates/api/payout-rates.server";
import { getPublicSiteSettings } from "@/features/site-settings/api/public-settings.server";

const MAXIMUM_MONETIZATION_LEVEL_ID = 3;

export async function generateMetadata(): Promise<Metadata> {
  const [settings, t] = await Promise.all([
    getPublicSiteSettings(),
    getTranslations("PayoutRates"),
  ]);

  return {
    title: `${t("title")} — ${settings.siteName}`,
    description: t("description"),
  };
}

export default async function PayoutRatePage() {
  const locale = await getLocale();
  const [settings, menus, payoutRateLevel, t] = await Promise.all([
    getPublicSiteSettings(),
    getPublicMenus(locale, [
      "header-primary",
      "header-actions",
      "mobile-primary",
      "footer-primary",
      "footer-legal",
    ]),
    getPublicPayoutRates(MAXIMUM_MONETIZATION_LEVEL_ID),
    getTranslations({ locale, namespace: "PayoutRates" }),
  ]);

  return (
    <PayoutRatesPage
      locale={locale}
      menus={menus.menus}
      payoutRateLevel={payoutRateLevel}
      settings={settings}
      t={t}
    />
  );
}
