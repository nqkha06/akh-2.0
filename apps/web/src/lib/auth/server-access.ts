import "server-only";

import { cookies, headers as requestHeaders } from "next/headers";
import { redirect } from "next/navigation";

import {
  AUTH_ERROR_CODES,
  isTerminalAuthError,
  readAuthError,
} from "@/lib/auth/auth-errors";

const backendApiUrl = process.env.API_INTERNAL_URL?.replace(/\/$/, "");
const refreshCookieName =
  process.env.AUTH_REFRESH_COOKIE_NAME || "stu_refresh_token";

function safeCallbackUrl(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/member";
}

export function loginUrl(callbackUrl: string, reason?: string) {
  const searchParams = new URLSearchParams({
    callbackUrl: safeCallbackUrl(callbackUrl),
  });
  if (reason) searchParams.set("reason", reason);
  return `/login?${searchParams.toString()}`;
}

export function refreshSessionUrl(callbackUrl: string) {
  const searchParams = new URLSearchParams({
    callbackUrl: safeCallbackUrl(callbackUrl),
  });
  return `/api/auth/refresh-session?${searchParams.toString()}`;
}

export async function serverApiFetch(
  path: string,
  init: RequestInit = {},
  callbackUrl = "/member",
) {
  if (!backendApiUrl) {
    throw new Error("Missing API_INTERNAL_URL environment variable.");
  }
  const resolvedCallbackUrl = await currentProtectedUrl(callbackUrl);
  const cookieStore = await cookies();
  const headers = new Headers(init.headers);
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${encodeURIComponent(value)}`)
    .join("; ");
  if (cookieHeader) headers.set("Cookie", cookieHeader);

  const response = await fetch(
    `${backendApiUrl}${path.startsWith("/") ? path : `/${path}`}`,
    {
      ...init,
      headers,
      cache: init.cache ?? "no-store",
    },
  );

  if (response.status === 401) {
    const error = await readAuthError(response);
    const hasRefreshCookie = Boolean(cookieStore.get(refreshCookieName)?.value);
    if (
      hasRefreshCookie &&
      (error.code === AUTH_ERROR_CODES.ACCESS_TOKEN_EXPIRED ||
        error.code === AUTH_ERROR_CODES.ACCESS_TOKEN_INVALID)
    ) {
      redirect(refreshSessionUrl(resolvedCallbackUrl));
    }
    if (isTerminalAuthError(error.code)) {
      redirect(loginUrl(resolvedCallbackUrl, "session-expired"));
    }
  }
  return response;
}

async function currentProtectedUrl(fallback: string) {
  const value = (await requestHeaders()).get("x-stu-protected-url");
  return value ? safeCallbackUrl(value) : safeCallbackUrl(fallback);
}
