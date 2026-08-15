import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import enMessages from "../../messages/en.json";
import idMessages from "../../messages/id.json";
import viMessages from "../../messages/vi.json";

import {
  defaultLocale,
  isLocaleSyntax,
  localeCookieName,
} from "@/i18n/config";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const requestedLocale = cookieStore.get(localeCookieName)?.value;
  const candidate = isLocaleSyntax(requestedLocale)
    ? requestedLocale
    : defaultLocale;
  const dynamic = await getDynamicMessages(candidate);
  const locale = dynamic?.locale ?? defaultLocale;
  const bundled = locale === "vi"
    ? viMessages
    : locale === "id"
      ? { ...enMessages, ...idMessages }
      : enMessages;

  return {
    locale,
    messages: mergeFlatMessages(bundled, dynamic?.messages ?? {}),
  };
});

type MessageTree = Record<string, unknown>;

async function getDynamicMessages(locale: string) {
  const backendApiUrl = process.env.API_INTERNAL_URL?.replace(/\/$/, "");
  if (!backendApiUrl) return ["vi", "en", "id"].includes(locale) ? { locale, messages: {} } : null;
  try {
    const response = await fetch(
      `${backendApiUrl}/languages/${encodeURIComponent(locale)}/ui-messages`,
      { cache: "no-store" },
    );
    if (!response.ok) return null;
    return (await response.json()) as {
      locale: string;
      messages: Record<string, string>;
    };
  } catch {
    return ["vi", "en", "id"].includes(locale) ? { locale, messages: {} } : null;
  }
}

function mergeFlatMessages(
  fallback: MessageTree,
  overrides: Record<string, string>,
) {
  const result = structuredClone(fallback);
  for (const [key, value] of Object.entries(overrides)) {
    const segments = key.split(".");
    if (
      !segments.length ||
      segments.some((segment) =>
        ["__proto__", "prototype", "constructor"].includes(segment),
      )
    ) {
      continue;
    }
    let cursor = result;
    for (const segment of segments.slice(0, -1)) {
      const next = cursor[segment];
      if (!next || typeof next !== "object" || Array.isArray(next)) {
        cursor[segment] = {};
      }
      cursor = cursor[segment] as MessageTree;
    }
    cursor[segments.at(-1)!] = value;
  }
  return result;
}
