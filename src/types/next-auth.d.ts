import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    status: string;
    backendAccessToken: string;
    backendAccessTokenExpiresAt: number;
    backendRefreshToken: string;
  }

  interface Session {
    backendAccessToken: string;
    authError?: "RefreshAccessTokenError";
    user: DefaultSession["user"] & {
      id: string;
      role: string;
      status: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    status?: string;
    backendAccessToken?: string;
    backendAccessTokenExpiresAt?: number;
    backendRefreshToken?: string;
    authError?: "RefreshAccessTokenError";
  }
}
