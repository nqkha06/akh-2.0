import "server-only";

import { cache } from "react";

import type { PublicSiteSettings } from "@/features/site-settings/types";

export const PUBLIC_SITE_SETTINGS_TAG = "public-site-settings";

const fallback: PublicSiteSettings = {
  siteName: "Linkicom",
  siteShortName: null,
  siteDescription:
    "Create link-in-bio pages, verified social unlocks and protected content experiences that turn creator traffic into real growth.",
  siteTagline: "One link. More momentum.",
  siteUrl: null,
  branding: {
    logoLight: null,
    logoDark: null,
    logoIcon: null,
    favicon: null,
    defaultOgImage: null,
  },
  socialLinks: [],
  contact: {
    email: null,
    supportEmail: null,
    phone: null,
    address: null,
    workingHours: null,
    mapUrl: null,
  },
  updatedAt: new Date(0).toISOString(),
};

export const getPublicSiteSettings = cache(async () => {
  const backendApiUrl = process.env.API_INTERNAL_URL?.replace(/\/$/, "");
  if (!backendApiUrl) return fallback;
  try {
    const response = await fetch(`${backendApiUrl}/site-config`, {
      next: { revalidate: 3600, tags: [PUBLIC_SITE_SETTINGS_TAG] },
    });
    if (!response.ok) return fallback;
    return (await response.json()) as PublicSiteSettings;
  } catch {
    return fallback;
  }
});
