import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_SESSION_COOKIE_PREFIXES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

export function proxy(request: NextRequest) {
  const hasSessionCookie = request.cookies.getAll().some(({ name }) =>
    AUTH_SESSION_COOKIE_PREFIXES.some(
      (prefix) => name === prefix || name.startsWith(`${prefix}.`),
    ),
  );

  if (hasSessionCookie) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(
      "x-stu-protected-url",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "callbackUrl",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/member/:path*", "/admin/:path*"],
};
