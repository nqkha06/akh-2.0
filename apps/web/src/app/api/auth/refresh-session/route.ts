import { NextResponse, type NextRequest } from "next/server";

import {
  BackendRefreshError,
  getSetCookieHeaders,
  refreshBackendSession,
} from "@/lib/auth/refresh-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const backendApiUrl = process.env.API_INTERNAL_URL?.replace(/\/$/, "");

export async function GET(request: NextRequest) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json(
      { statusCode: 403, message: "Origin không được phép refresh session." },
      { status: 403 },
    );
  }
  const callbackUrl = safeCallbackUrl(
    request.nextUrl.searchParams.get("callbackUrl"),
  );
  const cookieHeader = request.headers.get("cookie") || "";
  if (!cookieHeader) return loginRedirect(request, callbackUrl);

  try {
    const refreshed = await refreshBackendSession(
      cookieHeader,
      request.nextUrl.origin,
    );
    const response = noStoreRedirect(new URL(callbackUrl, request.url));
    appendCookies(response.headers, refreshed.setCookies);
    return response;
  } catch (error) {
    if (error instanceof BackendRefreshError && error.status >= 500) {
      return NextResponse.json(
        {
          statusCode: error.status,
          code: error.code,
          message: "Dịch vụ xác thực tạm thời không khả dụng.",
          retryable: true,
        },
        { status: error.status, headers: { "Cache-Control": "no-store" } },
      );
    }
    return clearSessionAndRedirect(request, callbackUrl, cookieHeader);
  }
}

async function clearSessionAndRedirect(
  request: NextRequest,
  callbackUrl: string,
  cookieHeader: string,
) {
  const response = loginRedirect(request, callbackUrl);
  if (!backendApiUrl) return response;
  try {
    const logoutResponse = await fetch(`${backendApiUrl}/auth/logout`, {
      method: "POST",
      headers: {
        Cookie: cookieHeader,
        Origin: request.nextUrl.origin,
      },
      cache: "no-store",
    });
    appendCookies(response.headers, getSetCookieHeaders(logoutResponse.headers));
  } catch {
    // The login redirect remains valid if the API is temporarily unavailable.
  }
  return response;
}

function loginRedirect(request: NextRequest, callbackUrl: string) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", callbackUrl);
  loginUrl.searchParams.set("reason", "session-expired");
  return noStoreRedirect(loginUrl);
}

function safeCallbackUrl(value: string | null) {
  if (
    value &&
    (value === "/" ||
      value === "/login" ||
      value.startsWith("/login?") ||
      value === "/register" ||
      value.startsWith("/register?") ||
      value === "/forgot-password" ||
      value === "/member" ||
      value.startsWith("/member/") ||
      value === "/admin" ||
      value.startsWith("/admin/"))
  ) {
    return value;
  }
  return "/member";
}

function noStoreRedirect(url: URL) {
  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function appendCookies(headers: Headers, cookies: string[]) {
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
}
