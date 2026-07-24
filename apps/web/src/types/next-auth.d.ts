import type { DefaultSession } from "next-auth";
import type { AuthErrorCode } from "@/lib/auth/auth-errors";

declare module "next-auth" {
  interface User {
    rank?: "bronze" | "gold" | "diamond" | null;
    role: string;
    roles: string[];
    permissions: string[];
    status: string;
    backendAccessToken: string;
    backendAccessTokenExpiresAt: number;
    backendRefreshToken: string;
  }

  interface Session {
    backendAccessToken?: string;
    backendAccessTokenExpiresAt?: number;
    authError?: AuthErrorCode;
    user: DefaultSession["user"] & {
      id: string;
      rank?: "bronze" | "gold" | "diamond" | null;
      role: string;
      roles: string[];
      permissions: string[];
      status: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    rank?: "bronze" | "gold" | "diamond" | null;
    role?: string;
    roles?: string[];
    permissions?: string[];
    status?: string;
    backendAccessToken?: string;
    backendAccessTokenExpiresAt?: number;
    backendRefreshToken?: string;
    authError?: AuthErrorCode;
  }
}
