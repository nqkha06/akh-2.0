import { UnauthorizedException } from "@nestjs/common";

export const AUTH_ERROR_CODES = {
  ACCESS_TOKEN_EXPIRED: "ACCESS_TOKEN_EXPIRED",
  ACCESS_TOKEN_INVALID: "ACCESS_TOKEN_INVALID",
  REFRESH_TOKEN_EXPIRED: "REFRESH_TOKEN_EXPIRED",
  REFRESH_TOKEN_INVALID: "REFRESH_TOKEN_INVALID",
  REFRESH_TOKEN_REUSE_DETECTED: "REFRESH_TOKEN_REUSE_DETECTED",
  SESSION_REVOKED: "SESSION_REVOKED",
  SESSION_NOT_FOUND: "SESSION_NOT_FOUND",
  USER_DISABLED: "USER_DISABLED",
} as const;

export type AuthErrorCode =
  (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

function authErrorBody(statusCode: number, code: AuthErrorCode, message: string) {
  return { statusCode, code, message };
}

export function unauthorizedAuthError(
  code: AuthErrorCode,
  message: string,
) {
  return new UnauthorizedException(authErrorBody(401, code, message));
}
