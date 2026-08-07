import type { Metadata } from "next";
import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";

import { ReportLinkPage } from "@/components/report-link/report-link-page";
import { getPublicMenus } from "@/features/admin-menus/api/public-menus.server";
import { getPublicSiteSettings } from "@/features/site-settings/api/public-settings.server";
import { getDashboardHref } from "@/lib/auth/redirects";
import { getOptionalServerUser } from "@/lib/auth/server-session";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, t] = await Promise.all([
    getPublicSiteSettings(),
    getTranslations("ReportLink"),
  ]);

  return {
    title: `${t("title")} — ${settings.siteName}`,
    description: t("description"),
    robots: { index: false, follow: true },
  };
}

export default async function ReportLinkRoute({
  searchParams,
}: {
  searchParams: Promise<{
    url?: string | string[];
    email?: string | string[];
    reason?: string | string[];
    details?: string | string[];
  }>;
}) {
  const locale = await getLocale();
  const query = await searchParams;
  const rawUrl = query.url;
  const requestedUrl = typeof rawUrl === "string" ? rawUrl : "";
  const [settings, menus, currentUser, requestHeaders] = await Promise.all([
    getPublicSiteSettings(),
    getPublicMenus(locale, [
      "header-primary",
      "header-actions",
      "mobile-primary",
      "footer-primary",
      "footer-legal",
    ]),
    getOptionalServerUser(),
    headers(),
  ]);
  const initialUrl = resolveReportedUrl(
    requestedUrl,
    requestHeaders,
    settings.siteUrl,
  );

  return (
    <ReportLinkPage
      dashboardHref={currentUser ? getDashboardHref(currentUser) : null}
      initialDetails={readQueryValue(query.details, 5_000)}
      initialEmail={readQueryValue(query.email, 320)}
      initialReason={readQueryValue(query.reason, 32)}
      initialUrl={initialUrl}
      menus={menus.menus}
      settings={settings}
    />
  );
}

function resolveReportedUrl(
  value: string,
  requestHeaders: Headers,
  fallbackOrigin: string | null,
) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (!trimmed.startsWith("/")) return trimmed.slice(0, 500);

  const forwardedHost = requestHeaders.get("x-forwarded-host")?.split(",")[0];
  const host = forwardedHost ?? requestHeaders.get("host");
  const forwardedProtocol = requestHeaders
    .get("x-forwarded-proto")
    ?.split(",")[0];
  const protocol =
    forwardedProtocol ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  const origin = host ? `${protocol}://${host}` : fallbackOrigin;
  if (!origin) return trimmed.slice(0, 500);

  return new URL(trimmed, origin).toString().slice(0, 500);
}

function readQueryValue(value: string | string[] | undefined, max: number) {
  return typeof value === "string" ? value.slice(0, max) : "";
}
