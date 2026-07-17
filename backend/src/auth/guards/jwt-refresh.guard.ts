import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

import {
  AUTH_ERROR_CODES,
  unauthorizedAuthError,
} from "../auth-errors";

@Injectable()
export class JwtRefreshGuard extends AuthGuard("jwt-refresh") {
  handleRequest<TUser>(
    error: unknown,
    user: TUser | false | null,
    info: unknown,
  ): TUser {
    if (error) throw error;
    if (isNamedError(info, "TokenExpiredError")) {
      throw unauthorizedAuthError(
        AUTH_ERROR_CODES.REFRESH_TOKEN_EXPIRED,
        "Refresh token expired",
      );
    }
    if (!user) {
      throw unauthorizedAuthError(
        AUTH_ERROR_CODES.REFRESH_TOKEN_INVALID,
        "Refresh token không hợp lệ.",
      );
    }
    return user;
  }
}

function isNamedError(value: unknown, name: string) {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    value.name === name
  );
}
