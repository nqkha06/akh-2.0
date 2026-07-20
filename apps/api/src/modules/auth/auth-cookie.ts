import type { ConfigService } from "@nestjs/config";
import type { CookieOptions, Request } from "express";

export function refreshCookieName(configService: ConfigService) {
  return configService.get<string>("AUTH_REFRESH_COOKIE_NAME") || "stu_refresh_token";
}

export function refreshCookieOptions(
  configService: ConfigService,
): CookieOptions {
  const configuredSameSite = configService.get<string>("AUTH_COOKIE_SAME_SITE");
  const sameSite = (configuredSameSite || "lax") as CookieOptions["sameSite"];
  const configuredSecure = configService.get<string>("AUTH_COOKIE_SECURE");
  const domain = configService.get<string>("AUTH_COOKIE_DOMAIN") || undefined;

  return {
    httpOnly: true,
    secure:
      configuredSecure === "true" ||
      (configuredSecure !== "false" && process.env.NODE_ENV === "production"),
    sameSite,
    path: configService.get<string>("AUTH_COOKIE_PATH") || "/api/auth",
    domain,
  };
}

export function readCookie(request: Request, name: string) {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;

  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const key = part.slice(0, separator).trim();
    if (key === name) {
      return decodeURIComponent(part.slice(separator + 1).trim());
    }
  }

  return undefined;
}
