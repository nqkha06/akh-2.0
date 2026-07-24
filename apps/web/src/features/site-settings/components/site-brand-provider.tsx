"use client";

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
} from "react";

import type { PublicSiteSettings } from "@/features/site-settings/types";

const SiteBrandContext = createContext<PublicSiteSettings | null>(null);

export function SiteBrandProvider({
  children,
  settings,
}: PropsWithChildren<{ settings: PublicSiteSettings }>) {
  const value = useMemo(() => settings, [settings]);

  return (
    <SiteBrandContext.Provider value={value}>
      {children}
    </SiteBrandContext.Provider>
  );
}

export function useSiteBrand() {
  const settings = useContext(SiteBrandContext);
  if (!settings) {
    throw new Error("useSiteBrand must be used inside SiteBrandProvider.");
  }
  return settings;
}

export function getSiteHost(settings: PublicSiteSettings) {
  if (!settings.siteUrl) return "";

  try {
    return new URL(settings.siteUrl).host;
  } catch {
    return settings.siteUrl
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .trim();
  }
}
