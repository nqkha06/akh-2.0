import { SetMetadata } from "@nestjs/common";

export const AUTH_RATE_LIMIT = "auth-rate-limit";

export type AuthRateLimitOptions = {
  limit: number;
  windowMs: number;
};

export const AuthRateLimit = (limit: number, windowMs: number) =>
  SetMetadata(AUTH_RATE_LIMIT, { limit, windowMs } satisfies AuthRateLimitOptions);
