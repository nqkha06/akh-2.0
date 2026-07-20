import NextAuth, { type NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { NextRequest } from "next/server";
import { z } from "zod";

import {
  AUTH_ERROR_CODES,
  isTerminalAuthError,
} from "@/lib/auth/auth-errors";
import {
  type BackendAuthResponse,
  type BackendAuthResult,
  BackendRefreshError,
  extractRefreshToken,
  refreshBackendSession,
} from "@/lib/auth/refresh-session";
import { REFERRAL_COOKIE_NAME } from "@/lib/auth/referral-cookie";

const backendApiUrl = process.env.API_INTERNAL_URL?.replace(/\/$/, "");
if (!backendApiUrl) {
  throw new Error("Missing API_INTERNAL_URL environment variable.");
}
const refreshCookieName =
  process.env.AUTH_REFRESH_COOKIE_NAME || "stu_refresh_token";

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
});

async function requestBackendAuth(
  path: "/auth/login" | "/auth/google",
  body: Record<string, string>,
) {
  const response = await fetch(`${backendApiUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) return null;
  const refreshToken = extractRefreshToken(response.headers.get("set-cookie"));
  if (!refreshToken) return null;

  return {
    ...((await response.json()) as BackendAuthResponse),
    refreshToken,
  } satisfies BackendAuthResult;
}

function applyBackendResult(token: JWT, result: BackendAuthResult) {
  token.sub = String(result.user.id);
  token.name = result.user.name;
  token.email = result.user.email;
  token.picture = result.user.avatar;
  token.role = result.user.role;
  token.roles = result.user.roles;
  token.permissions = result.user.permissions;
  token.status = result.user.status;
  token.backendAccessToken = result.accessToken;
  token.backendAccessTokenExpiresAt = result.accessTokenExpiresAt;
  token.backendRefreshToken = result.refreshToken;
  token.authError = undefined;
  return token;
}

async function revokeBackendSession(refreshToken?: string) {
  if (!refreshToken) return;
  try {
    await fetch(`${backendApiUrl}/auth/logout`, {
      method: "POST",
      headers: { Cookie: `${refreshCookieName}=${encodeURIComponent(refreshToken)}` },
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    // Auth.js must still clear its own cookie when the backend is unavailable.
  }
}

const googleEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

function createAuthConfig(request?: NextRequest): NextAuthConfig {
  const exposeBackendState =
    request === undefined ||
    request.nextUrl.pathname.startsWith("/api/backend");

  return {
    trustHost: true,
    pages: {
      signIn: "/login",
      error: "/login",
    },
    session: {
      strategy: "jwt",
      maxAge: 7 * 24 * 60 * 60,
    },
    providers: [
      Credentials({
        name: "Email và mật khẩu",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Mật khẩu", type: "password" },
        },
        async authorize(credentials) {
          const parsed = signInSchema.safeParse(credentials);
          if (!parsed.success) return null;

          const result = await requestBackendAuth("/auth/login", parsed.data);
          if (!result) return null;

          return {
            id: String(result.user.id),
            name: result.user.name,
            email: result.user.email,
            image: result.user.avatar,
            role: result.user.role,
            roles: result.user.roles,
            permissions: result.user.permissions,
            status: result.user.status,
            backendAccessToken: result.accessToken,
            backendAccessTokenExpiresAt: result.accessTokenExpiresAt,
            backendRefreshToken: result.refreshToken,
          };
        },
      }),
      ...(googleEnabled ? [Google] : []),
    ],
    callbacks: {
      authorized({ auth: session, request: authorizedRequest }) {
        const isProtectedRoute =
          authorizedRequest.nextUrl.pathname.startsWith("/member") ||
          authorizedRequest.nextUrl.pathname.startsWith("/admin");

        if (isProtectedRoute) {
          return Boolean(
            session?.user &&
              session.backendAccessToken &&
              !isTerminalAuthError(session.authError),
          );
        }
        return true;
      },
      async jwt({ token, user, account, trigger }) {
        if (user?.backendAccessToken && user.backendRefreshToken) {
          token.backendAccessToken = user.backendAccessToken;
          token.backendAccessTokenExpiresAt = user.backendAccessTokenExpiresAt;
          token.backendRefreshToken = user.backendRefreshToken;
          token.role = user.role;
          token.roles = user.roles;
          token.permissions = user.permissions;
          token.status = user.status;
          token.authError = undefined;
        }

        if (account?.provider === "google" && account.id_token) {
          const referralCode = request?.cookies.get(
            REFERRAL_COOKIE_NAME,
          )?.value;
          const result = await requestBackendAuth("/auth/google", {
            idToken: account.id_token,
            ...(referralCode ? { referralCode } : {}),
          });
          if (!result) throw new Error("BACKEND_GOOGLE_AUTH_FAILED");
          return applyBackendResult(token, result);
        }

        // Refresh is a state-changing operation because NestJS rotates the
        // refresh token. Only an explicit update from a Route Handler may do
        // it; auth() inside a Server Component cannot persist the new cookie.
        if (trigger !== "update") return token;

        if (!token.backendRefreshToken) {
          token.authError = AUTH_ERROR_CODES.SESSION_NOT_FOUND;
          token.backendAccessToken = undefined;
          return token;
        }

        try {
          const result = await refreshBackendSession(token.backendRefreshToken);
          return applyBackendResult(token, result);
        } catch (error) {
          const code =
            error instanceof BackendRefreshError
              ? error.code
              : AUTH_ERROR_CODES.AUTH_SERVICE_UNAVAILABLE;
          token.authError = code;

          if (isTerminalAuthError(code)) {
            token.backendAccessToken = undefined;
            token.backendRefreshToken = undefined;
          }
          return token;
        }
      },
      session({ session, token }) {
        if (session.user) {
          session.user.id = token.sub || "";
          session.user.role = String(token.role || "member");
          session.user.roles = Array.isArray(token.roles) ? token.roles : [];
          session.user.permissions = Array.isArray(token.permissions)
            ? token.permissions
            : [];
          session.user.status = String(token.status || "active");
        }

        if (exposeBackendState) {
          session.backendAccessToken = String(token.backendAccessToken || "");
          session.backendAccessTokenExpiresAt = Number(
            token.backendAccessTokenExpiresAt || 0,
          );
          session.authError = token.authError;
        } else {
          delete session.backendAccessToken;
          delete session.backendAccessTokenExpiresAt;
          delete session.authError;
        }
        return session;
      },
    },
    events: {
      async signOut(message) {
        if ("token" in message) {
          await revokeBackendSession(message.token?.backendRefreshToken);
        }
      },
    },
  };
}

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth(
  (request) => createAuthConfig(request),
);
