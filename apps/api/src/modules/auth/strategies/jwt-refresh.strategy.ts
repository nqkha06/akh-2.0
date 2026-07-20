import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import type { Request } from "express";
import { Strategy } from "passport-jwt";

import { readCookie, refreshCookieName } from "../auth-cookie";
import type { RefreshJwtPayload } from "../auth.types";
import {
  AUTH_ERROR_CODES,
  unauthorizedAuthError,
} from "../auth-errors";

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  "jwt-refresh",
) {
  private readonly cookieName: string;

  constructor(configService: ConfigService) {
    const cookieName = refreshCookieName(configService);
    super({
      jwtFromRequest: (request: Request) => readCookie(request, cookieName) || null,
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>("JWT_REFRESH_SECRET"),
      passReqToCallback: true,
    });
    this.cookieName = cookieName;
  }

  validate(request: Request, payload: RefreshJwtPayload) {
    const refreshToken = readCookie(request, this.cookieName);
    if (payload.type !== "refresh" || !payload.sid || !refreshToken) {
      throw unauthorizedAuthError(
        AUTH_ERROR_CODES.REFRESH_TOKEN_INVALID,
        "Refresh token không hợp lệ.",
      );
    }
    return { payload, refreshToken };
  }
}
