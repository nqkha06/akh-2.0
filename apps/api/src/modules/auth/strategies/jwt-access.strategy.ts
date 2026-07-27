import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { Request } from "express";

import { PrismaService } from "../../../database/prisma/prisma.service";
import {
  resolveUserAuthorization,
  userAuthorizationInclude,
} from "../../authorization/user-authorization";
import type { AccessJwtPayload } from "../auth.types";
import { accessCookieName, readCookie } from "../auth-cookie";
import {
  AUTH_ERROR_CODES,
  unauthorizedAuthError,
} from "../auth-errors";

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, "jwt-access") {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const cookieName = accessCookieName(configService);
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request) => readCookie(request, cookieName) || null,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>("JWT_ACCESS_SECRET"),
    });
  }

  async validate(payload: AccessJwtPayload) {
    if (payload.type !== "access" || !payload.sid) {
      throw unauthorizedAuthError(
        AUTH_ERROR_CODES.ACCESS_TOKEN_INVALID,
        "Access token không hợp lệ.",
      );
    }

    const session = await this.prisma.authSession.findUnique({
      where: { id: payload.sid },
      include: {
        user: { include: userAuthorizationInclude },
      },
    });
    const user = session?.user;

    if (!session || !user || session.userId !== payload.sub) {
      throw unauthorizedAuthError(
        AUTH_ERROR_CODES.SESSION_NOT_FOUND,
        "Không tìm thấy phiên đăng nhập.",
      );
    }
    if (session.revokedAt || session.expiresAt <= new Date()) {
      throw unauthorizedAuthError(
        AUTH_ERROR_CODES.SESSION_REVOKED,
        "Phiên đăng nhập không còn hợp lệ.",
      );
    }
    if (user.status !== "active") {
      throw unauthorizedAuthError(
        AUTH_ERROR_CODES.USER_DISABLED,
        "Tài khoản hiện không hoạt động.",
      );
    }

    const authorization = resolveUserAuthorization(user);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt,
      avatar: user.avatar,
      status: user.status,
      ...authorization,
      tokenVersion: user.tokenVersion,
      sessionId: session.id,
    };
  }
}
