import "server-only";

import type { PublicLanguagesResponse } from "../types";

export async function getPublicLanguageDirection(locale: string) {
  const backendApiUrl = process.env.API_INTERNAL_URL?.replace(/\/$/, "");
  if (!backendApiUrl) return "ltr" as const;
  try {
    const response = await fetch(`${backendApiUrl}/languages`, {
      cache: "no-store",
    });
    if (!response.ok) return "ltr" as const;
    const result = (await response.json()) as PublicLanguagesResponse;
    return result.items.find((item) => item.locale === locale)?.isRtl
      ? ("rtl" as const)
      : ("ltr" as const);
  } catch {
    return "ltr" as const;
  }
}
