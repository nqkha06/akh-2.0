import "server-only";

import { cache } from "react";

import { publicPagePath } from "@/features/pages/public-page-url";
import type { PublicPage } from "@/features/pages/types";

export const getPublicPage = cache(async (input: string) => {
  const path = publicPagePath(input);
  const backendApiUrl = process.env.API_INTERNAL_URL?.replace(/\/$/, "");
  if (!path || !backendApiUrl) return null;

  const slug = path.slice(1);
  const response = await fetch(
    `${backendApiUrl}/public/pages/${encodeURIComponent(slug)}`,
    { cache: "no-store" },
  );
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Không thể tải trang public (${response.status}).`);
  }
  return (await response.json()) as PublicPage;
});
