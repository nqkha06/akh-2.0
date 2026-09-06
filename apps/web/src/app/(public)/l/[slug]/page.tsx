import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";

import { recordLinkVisit } from "@/lib/api-client";
import { SystemStatusPage } from "@/components/status/system-status-page";
import { PublicLinkUnlock } from "./public-link-unlock";

export const dynamic = "force-dynamic";

export default async function PublicLinkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const requestHeaders = await headers();
  const link = await recordLinkVisit(slug, {
    countryCode: getVisitorCountry(requestHeaders),
    userAgent: requestHeaders.get("user-agent"),
    ipAddress: getVisitorIp(requestHeaders),
    referrer: requestHeaders.get("referer"),
  }).catch(() => null);

  if (!link) {
    notFound();
  }

  const status = link.status.toLowerCase();

  if (["violated", "violation", "blocked", "suspended"].includes(status)) {
    return <SystemStatusPage kind="violation" />;
  }

  if (["deleted", "removed"].includes(status)) {
    return <SystemStatusPage kind="deleted" />;
  }

  if (["inactive", "paused", "expired"].includes(status)) {
    return <SystemStatusPage kind="unavailable" />;
  }

  if (link.monetizationRedirectUrl) {
    const redirectUrl = buildMonetizationRedirectUrl(
      link.monetizationRedirectUrl,
      link.slug,
      link.visitToken,
      getRequestOrigin(requestHeaders),
    );
    if (redirectUrl) redirect(redirectUrl);
  }

  return <PublicLinkUnlock link={link} />;
}

function getVisitorCountry(requestHeaders: Headers) {
  return (
    requestHeaders.get("cf-ipcountry") ??
    requestHeaders.get("x-vercel-ip-country") ??
    requestHeaders.get("cloudfront-viewer-country") ??
    requestHeaders.get("x-country-code") ??
    process.env.VISITOR_COUNTRY_FALLBACK ??
    "ZZ"
  );
}

function getVisitorIp(requestHeaders: Headers) {
  return (
    requestHeaders.get("cf-connecting-ip") ??
    requestHeaders.get("x-real-ip") ??
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null
  );
}

function getRequestOrigin(requestHeaders: Headers) {
  const forwardedHost = requestHeaders.get("x-forwarded-host")?.split(",")[0];
  const host = forwardedHost ?? requestHeaders.get("host");
  const forwardedProtocol = requestHeaders
    .get("x-forwarded-proto")
    ?.split(",")[0];
  const protocol =
    forwardedProtocol ?? (process.env.NODE_ENV === "production" ? "https" : "http");

  return host ? `${protocol}://${host}` : "http://localhost:3000";
}

function buildMonetizationRedirectUrl(
  targetUrl: string,
  slug: string,
  visitToken: string | null | undefined,
  origin: string,
) {
  try {
    const redirectUrl = new URL(resolveRouteSlug(targetUrl, slug));
    const dataUrl = new URL(
      `/api/public/links/${encodeURIComponent(slug)}`,
      origin,
    );
    if (!visitToken) return null;
    dataUrl.searchParams.set("visitToken", visitToken);

    redirectUrl.searchParams.set("slug", slug);
    redirectUrl.searchParams.set("dataUrl", dataUrl.toString());
    return redirectUrl.toString();
  } catch {
    return null;
  }
}

function resolveRouteSlug(targetUrl: string, slug: string) {
  const encodedSlug = encodeURIComponent(slug);
  const resolvedTarget = targetUrl.replace(
    /\/\.(?=([?#]|$))/,
    `/${encodedSlug}`,
  );

  // `/.` is the compact router placeholder used by the admin UI, e.g.
  // http://localhost:3100/l/. -> http://localhost:3100/l/pkh4bd4t.
  return new URL(resolvedTarget).toString();
}
