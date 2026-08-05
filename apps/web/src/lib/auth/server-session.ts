import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import type { AuthUser } from "@/features/auth/types";
import { refreshSessionUrl } from "@/lib/auth/server-access";

const backendApiUrl = process.env.API_INTERNAL_URL?.replace(/\/$/, "");
const accessCookieName =
  process.env.AUTH_ACCESS_COOKIE_NAME || "stu_access_token";
const refreshCookieName =
  process.env.AUTH_REFRESH_COOKIE_NAME || "stu_refresh_token";

export const getOptionalServerUser = cache(async (
  callbackUrl = "/",
): Promise<AuthUser | null> => {
  if (!backendApiUrl) {
    throw new Error("Missing API_INTERNAL_URL environment variable.");
  }
  const cookieStore = await cookies();
  const hasRefreshCookie = Boolean(cookieStore.get(refreshCookieName)?.value);
  if (!cookieStore.get(accessCookieName)?.value) {
    if (hasRefreshCookie) redirect(refreshSessionUrl(callbackUrl));
    return null;
  }
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${encodeURIComponent(value)}`)
    .join("; ");
  const response = await fetch(`${backendApiUrl}/auth/me`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
  if (response.status === 401 && hasRefreshCookie) {
    redirect(refreshSessionUrl(callbackUrl));
  }
  return response.ok ? ((await response.json()) as AuthUser) : null;
});
