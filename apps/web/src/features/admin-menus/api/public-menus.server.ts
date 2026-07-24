import "server-only";

import { cache } from "react";

import type {
  PublicMenusResponse,
  WebsiteMenuLocation,
} from "../types";

export const getPublicMenus = cache(
  async (
    locale: string,
    locations: readonly WebsiteMenuLocation[],
  ): Promise<PublicMenusResponse> => {
    const backendApiUrl = process.env.API_INTERNAL_URL?.replace(/\/$/, "");
    const fallback: PublicMenusResponse = { locale, menus: {} };
    if (!backendApiUrl) return fallback;
    try {
      const query = new URLSearchParams({
        locale,
        locations: locations.join(","),
      });
      const response = await fetch(
        `${backendApiUrl}/website/menus?${query.toString()}`,
        { next: { revalidate: 60, tags: ["public-website-menus"] } },
      );
      if (!response.ok) return fallback;
      return (await response.json()) as PublicMenusResponse;
    } catch {
      return fallback;
    }
  },
);
