import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import type { AuthUser } from "@/features/auth/types";

const backendApiUrl = process.env.API_INTERNAL_URL?.replace(/\/$/, "");
const accessCookieName =
  process.env.AUTH_ACCESS_COOKIE_NAME || "stu_access_token";

export const getOptionalServerUser = cache(async (): Promise<AuthUser | null> => {
  if (!backendApiUrl) {
    throw new Error("Missing API_INTERNAL_URL environment variable.");
  }
  const cookieStore = await cookies();
  if (!cookieStore.get(accessCookieName)?.value) return null;
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${encodeURIComponent(value)}`)
    .join("; ");
  const response = await fetch(`${backendApiUrl}/auth/me`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
  return response.ok ? ((await response.json()) as AuthUser) : null;
});
