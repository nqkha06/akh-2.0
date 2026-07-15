import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";

const backendApiUrl = (
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000/api"
).replace(/\/$/, "");

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
};

type BackendAuthResponse = {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: string;
  user: BackendUser;
};

async function requestBackendAuth(
  path: "/auth/login" | "/auth/google",
  body: Record<string, string>,
) {
  const response = await fetch(`${backendApiUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) return null;
  return (await response.json()) as BackendAuthResponse;
}

const googleEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
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
          status: result.user.status,
          backendAccessToken: result.accessToken,
        };
      },
    }),
    ...(googleEnabled ? [Google] : []),
  ],
  callbacks: {
    authorized({ auth: session, request }) {
      if (request.nextUrl.pathname.startsWith("/member")) {
        return Boolean(session?.user);
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user?.backendAccessToken) {
        token.backendAccessToken = user.backendAccessToken;
        token.role = user.role;
        token.status = user.status;
      }

      if (account?.provider === "google" && account.id_token) {
        const result = await requestBackendAuth("/auth/google", {
          idToken: account.id_token,
        });

        if (!result) throw new Error("BACKEND_GOOGLE_AUTH_FAILED");

        token.sub = String(result.user.id);
        token.name = result.user.name;
        token.email = result.user.email;
        token.picture = result.user.avatar;
        token.role = result.user.role;
        token.status = result.user.status;
        token.backendAccessToken = result.accessToken;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || "";
        session.user.role = String(token.role || "member");
        session.user.status = String(token.status || "active");
      }
      session.backendAccessToken = String(token.backendAccessToken || "");
      return session;
    },
  },
});
