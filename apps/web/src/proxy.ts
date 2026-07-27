import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const accessCookieName =
  process.env.AUTH_ACCESS_COOKIE_NAME || "stu_access_token";
const refreshCookieName =
  process.env.AUTH_REFRESH_COOKIE_NAME || "stu_refresh_token";

export function proxy(request: NextRequest) {
  const callbackUrl = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  if (request.cookies.get(accessCookieName)?.value) {
    const headers = new Headers(request.headers);
    headers.set("x-stu-protected-url", callbackUrl);
    return NextResponse.next({ request: { headers } });
  }

  if (request.cookies.get(refreshCookieName)?.value) {
    const refreshUrl = new URL("/api/auth/refresh-session", request.url);
    refreshUrl.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(refreshUrl);
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", callbackUrl);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/member/:path*", "/admin/:path*"],
};
