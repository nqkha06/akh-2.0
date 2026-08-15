import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";
import { getLocale, getTranslations } from "next-intl/server";
import { getPublicMenus } from "@/features/admin-menus/api/public-menus.server";
import { getPublicSiteSettings } from "@/features/site-settings/api/public-settings.server";
import { getDashboardHref } from "@/lib/auth/redirects";
import { getOptionalServerUser } from "@/lib/auth/server-session";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, t] = await Promise.all([
    getPublicSiteSettings(),
    getTranslations("Landing.meta"),
  ]);

  return {
    title: `${settings.siteName} — ${t("tagline")}`,
    description: t("description"),
    openGraph: {
      title: `${settings.siteName} — ${t("tagline")}`,
      description: t("description"),
    },
  };
}

export default async function Home() {
  const locale = await getLocale();
  const [settings, menus, currentUser] = await Promise.all([
    getPublicSiteSettings(),
    getPublicMenus(locale, [
      "header-primary",
      "header-actions",
      "mobile-primary",
      "footer-primary",
      "footer-legal",
      "footer-social",
    ]),
    getOptionalServerUser(),
  ]);
  return (
    <LandingPage
      dashboardHref={currentUser ? getDashboardHref(currentUser) : null}
      menus={menus.menus}
      settings={settings}
    />
  );
}
