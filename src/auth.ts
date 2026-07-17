import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";

const backendApiUrl = (
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000/api"
).replace(/\/$/, "");
const refreshCookieName =
  process.env.AUTH_REFRESH_COOKIE_NAME || "stu_refresh_token";

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
});

type BackendUser = {
  id: number;
  name: string;
  email: string;
  emailVerifiedAt: string | null;
  avatar: string | null;
  status: string;
  role: string;
  roles: string[];
  permissions: string[];
};

type BackendAuthResponse = {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: string;
  accessTokenExpiresAt: number;
  user: BackendUser;
};

type BackendAuthResult = BackendAuthResponse & { refreshToken: string };

function extractRefreshToken(setCookie: string | null) {
  if (!setCookie) return null;
  const match = new RegExp(`(?:^|,\\s*)${refreshCookieName}=([^;]+)`).exec(
    setCookie,
  );
  return match ? decodeURIComponent(match[1]) : null;
}

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

const refreshRequests = new Map<string, Promise<BackendAuthResult>>();

async function refreshBackendAuth(refreshToken: string) {
  const inFlight = refreshRequests.get(refreshToken);
  if (inFlight) return inFlight;

  const request = (async () => {
    const response = await fetch(`${backendApiUrl}/auth/refresh`, {
      method: "POST",
      headers: { Cookie: `${refreshCookieName}=${encodeURIComponent(refreshToken)}` },
      credentials: "include",
      cache: "no-store",
    });
    if (!response.ok) throw new Error("BACKEND_REFRESH_FAILED");

    const rotatedRefreshToken = extractRefreshToken(
      response.headers.get("set-cookie"),
    );
    if (!rotatedRefreshToken) throw new Error("BACKEND_REFRESH_COOKIE_MISSING");

    return {
      ...((await response.json()) as BackendAuthResponse),
      refreshToken: rotatedRefreshToken,
    } satisfies BackendAuthResult;
  })();

  refreshRequests.set(refreshToken, request);
  try {
    return await request;
  } finally {
    refreshRequests.delete(refreshToken);
  }
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

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
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
    authorized({ auth: session, request }) {
      const isProtectedRoute =
        request.nextUrl.pathname.startsWith("/member") ||
        request.nextUrl.pathname.startsWith("/admin");

      if (isProtectedRoute) {
        return Boolean(
          session?.user && session.backendAccessToken && !session.authError,
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
        const result = await requestBackendAuth("/auth/google", {
          idToken: account.id_token,
        });
        if (!result) throw new Error("BACKEND_GOOGLE_AUTH_FAILED");
        return applyBackendResult(token, result);
      }

      const expiresAt = Number(token.backendAccessTokenExpiresAt || 0);
      const shouldRefresh =
        trigger === "update" || !expiresAt || Date.now() >= expiresAt - 30_000;
      if (!shouldRefresh) return token;

      if (!token.backendRefreshToken) {
        token.authError = "RefreshAccessTokenError";
        return token;
      }

      try {
        const result = await refreshBackendAuth(token.backendRefreshToken);
        return applyBackendResult(token, result);
      } catch {
        token.authError = "RefreshAccessTokenError";
        token.backendAccessToken = undefined;
        token.backendRefreshToken = undefined;
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
      session.backendAccessToken = String(token.backendAccessToken || "");
      session.authError = token.authError;
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
});
