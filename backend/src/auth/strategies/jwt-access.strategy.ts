import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import { PrismaService } from "../../prisma/prisma.service";
import {
  resolveUserAuthorization,
  userAuthorizationInclude,
} from "../../authorization/user-authorization";
import type { AccessJwtPayload } from "../auth.types";

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, "jwt-access") {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>("JWT_ACCESS_SECRET"),
    });
  }

  async validate(payload: AccessJwtPayload) {
    if (payload.type !== "access" || !payload.sid) {
      throw new UnauthorizedException("Access token không hợp lệ.");
    }

    const session = await this.prisma.authSession.findUnique({
      where: { id: payload.sid },
      include: {
        user: { include: userAuthorizationInclude },
      },
    });
    const user = session?.user;

    if (
      !session ||
      !user ||
      session.userId !== payload.sub ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      user.status !== "active"
    ) {
      throw new UnauthorizedException("Phiên đăng nhập không còn hợp lệ.");
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
