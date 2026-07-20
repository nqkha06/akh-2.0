import type { DefaultSession } from "next-auth";
import type { AuthErrorCode } from "@/lib/auth/auth-errors";

declare module "next-auth" {
  interface User {
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
    authError?: AuthErrorCode;
    user: DefaultSession["user"] & {
      id: string;
      role: string;
      roles: string[];
      permissions: string[];
      status: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
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
