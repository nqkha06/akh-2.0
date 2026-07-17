import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService, type JwtSignOptions } from "@nestjs/jwt";
import { Prisma } from "@prisma/client";
import { compare, hash } from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import {
  createHash,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";

import { parseDurationMs } from "../config/env.validation";
import {
  resolveUserAuthorization,
  userAuthorizationInclude,
} from "../authorization/user-authorization";
import { PrismaService } from "../prisma/prisma.service";
import type {
  AccessJwtPayload,
  AuthenticatedUser,
  RefreshJwtPayload,
  SessionContext,
} from "./auth.types";
import {
  AUTH_ERROR_CODES,
  unauthorizedAuthError,
} from "./auth-errors";
import type { RegisterDto } from "./dto/register.dto";

const INVALID_CREDENTIALS_MESSAGE = "Email hoặc mật khẩu không chính xác.";
const DUMMY_PASSWORD_HASH =
  "$2b$12$M6oVeaKyMkEGNAg1J4aQSe8d8r94bHIpATvndSBH0cmJb9aJw8R5u";

@Injectable()
export class AuthService {
  private readonly googleClient = new OAuth2Client();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    try {
      const user = await this.prisma.user.create({
        data: {
          name: dto.name.trim(),
          email: this.normalizeEmail(dto.email),
          passwordHash: await hash(dto.password, 12),
          status: "active",
          roles: {
            create: { role: { connect: { key: "member" } } },
          },
        },
      });
      return this.toPublicUser(await this.toAuthenticatedUser(user));
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Email đã được sử dụng.");
      }
      throw error;
    }
  }

  async validateCredentials(emailInput: string, password: string) {
    const email = this.normalizeEmail(emailInput);
    const user = await this.prisma.user.findUnique({ where: { email } });
    const passwordMatches = await compare(
      password,
      user?.passwordHash
        ? this.normalizeLegacyHash(user.passwordHash)
        : DUMMY_PASSWORD_HASH,
    );

    if (
      !user?.passwordHash ||
      user.status !== "active" ||
      !passwordMatches ||
      (this.requiresVerifiedEmail() && !user.emailVerifiedAt)
    ) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    return this.toAuthenticatedUser(user);
  }

  async createSession(user: AuthenticatedUser, context: SessionContext) {
    const sessionId = randomUUID();
    const rotationCounter = 0;
    const expiresAt = new Date(Date.now() + this.refreshLifetimeMs());
    const tokens = await this.issueTokenPair(user, sessionId, rotationCounter);

    await this.prisma.authSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshTokenHash: this.hashRefreshToken(tokens.refreshToken),
        rotationCounter,
        expiresAt,
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
      },
    });

    return {
      response: this.toAuthResponse(tokens.accessToken, user),
      refreshToken: tokens.refreshToken,
    };
  }

  async refresh(
    payload: RefreshJwtPayload,
    refreshToken: string,
    context: SessionContext,
  ) {
    const presentedHash = this.hashRefreshToken(refreshToken);
    const session = await this.prisma.authSession.findUnique({
      where: { id: payload.sid },
      include: { user: true },
    });

    if (!session || session.userId !== payload.sub) {
      throw unauthorizedAuthError(
        AUTH_ERROR_CODES.SESSION_NOT_FOUND,
        "Không tìm thấy phiên đăng nhập.",
      );
    }
    if (session.revokedAt) {
      throw unauthorizedAuthError(
        AUTH_ERROR_CODES.SESSION_REVOKED,
        "Phiên đăng nhập đã bị thu hồi.",
      );
    }
    if (session.expiresAt <= new Date()) {
      throw unauthorizedAuthError(
        AUTH_ERROR_CODES.REFRESH_TOKEN_EXPIRED,
        "Refresh token đã hết hạn.",
      );
    }
    if (
      session.user.status !== "active" ||
      (this.requiresVerifiedEmail() && !session.user.emailVerifiedAt)
    ) {
      throw unauthorizedAuthError(
        AUTH_ERROR_CODES.USER_DISABLED,
        "Tài khoản hiện không hoạt động.",
      );
    }

    const isPresentedTokenCurrent =
      payload.rot === session.rotationCounter &&
      this.hashesEqual(presentedHash, session.refreshTokenHash);
    if (!isPresentedTokenCurrent) {
      return this.rejectRefreshTokenReuse(session.id);
    }

    const user = await this.toAuthenticatedUser(session.user);
    const nextRotation = session.rotationCounter + 1;
    const tokens = await this.issueTokenPair(user, session.id, nextRotation);
    const nextHash = this.hashRefreshToken(tokens.refreshToken);
    const now = new Date();
    const rotated = await this.prisma.authSession.updateMany({
      where: {
        id: session.id,
        userId: session.userId,
        rotationCounter: session.rotationCounter,
        refreshTokenHash: session.refreshTokenHash,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: {
        refreshTokenHash: nextHash,
        rotationCounter: nextRotation,
        userAgent: context.userAgent || session.userAgent,
        ipAddress: context.ipAddress || session.ipAddress,
      },
    });

    if (rotated.count !== 1) {
      return this.rejectRefreshTokenReuse(session.id);
    }

    return {
      response: this.toAuthResponse(tokens.accessToken, user),
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) return;

    try {
      const payload = await this.jwtService.verifyAsync<RefreshJwtPayload>(
        refreshToken,
        {
          secret: this.refreshSecret(),
          ignoreExpiration: true,
        },
      );

      if (payload.type === "refresh" && payload.sid) {
        await this.revokeSession(payload.sid);
      }
    } catch {
      // Logout is intentionally idempotent and never exposes token details.
    }
  }

  async logoutAll(userId: number) {
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.authSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { tokenVersion: { increment: 1 } },
      }),
    ]);
  }

  async loginWithGoogle(idToken: string) {
    const clientId = this.configService.get<string>("AUTH_GOOGLE_ID");

    if (!clientId) {
      throw new ServiceUnavailableException(
        "Google OAuth chưa được cấu hình trên máy chủ.",
      );
    }

    let ticket;
    try {
      ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: clientId,
      });
    } catch {
      throw new UnauthorizedException("Google ID token không hợp lệ.");
    }

    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      throw new UnauthorizedException("Tài khoản Google chưa xác minh email.");
    }

    const email = this.normalizeEmail(payload.email);
    const user = await this.findOrCreateGoogleUser({
      providerAccountId: payload.sub,
      email,
      name: payload.name?.trim() || email.split("@")[0],
      avatar: payload.picture || null,
    });

    if (user.status !== "active") {
      throw new UnauthorizedException("Tài khoản hiện không thể đăng nhập.");
    }

    return this.toAuthenticatedUser(user);
  }

  toPublicUser(user: AuthenticatedUser) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt,
      avatar: user.avatar,
      status: user.status,
      role: user.role,
      roles: user.roles,
      permissions: user.permissions,
    };
  }

  private async issueTokenPair(
    user: AuthenticatedUser,
    sessionId: string,
    rotationCounter: number,
  ) {
    const accessPayload: AccessJwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sid: sessionId,
      type: "access",
    };
    const refreshPayload: RefreshJwtPayload = {
      sub: user.id,
      sid: sessionId,
      rot: rotationCounter,
      type: "refresh",
    };
    const accessExpiresIn = this.configService.getOrThrow<string>(
      "JWT_ACCESS_EXPIRES_IN",
    );
    const refreshExpiresIn = this.configService.getOrThrow<string>(
      "JWT_REFRESH_EXPIRES_IN",
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.accessSecret(),
        expiresIn: accessExpiresIn as JwtSignOptions["expiresIn"],
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.refreshSecret(),
        expiresIn: refreshExpiresIn as JwtSignOptions["expiresIn"],
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private toAuthResponse(accessToken: string, user: AuthenticatedUser) {
    const expiresIn = this.configService.getOrThrow<string>(
      "JWT_ACCESS_EXPIRES_IN",
    );
    return {
      accessToken,
      tokenType: "Bearer" as const,
      expiresIn,
      accessTokenExpiresAt: Date.now() + parseDurationMs(expiresIn),
      user: this.toPublicUser(user),
    };
  }

  private async revokeSession(sessionId: string) {
    await this.prisma.authSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async rejectRefreshTokenReuse(sessionId: string): Promise<never> {
    await this.revokeSession(sessionId);
    throw unauthorizedAuthError(
      AUTH_ERROR_CODES.REFRESH_TOKEN_REUSE_DETECTED,
      "Phát hiện refresh token cũ được sử dụng lại. Phiên đã bị thu hồi.",
    );
  }

  private hashRefreshToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private hashesEqual(left: string, right: string) {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    return (
      leftBuffer.length === rightBuffer.length &&
      timingSafeEqual(leftBuffer, rightBuffer)
    );
  }

  private refreshLifetimeMs() {
    return parseDurationMs(
      this.configService.getOrThrow<string>("JWT_REFRESH_EXPIRES_IN"),
    );
  }

  private accessSecret() {
    return this.configService.getOrThrow<string>("JWT_ACCESS_SECRET");
  }

  private refreshSecret() {
    return this.configService.getOrThrow<string>("JWT_REFRESH_SECRET");
  }

  private requiresVerifiedEmail() {
    return this.configService.get<string>("AUTH_REQUIRE_EMAIL_VERIFICATION") === "true";
  }

  private async findOrCreateGoogleUser(input: {
    providerAccountId: string;
    email: string;
    name: string;
    avatar: string | null;
  }) {
    const linkedAccount = await this.prisma.socialAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "google",
          providerAccountId: input.providerAccountId,
        },
      },
      include: { user: true },
    });

    if (linkedAccount) return linkedAccount.user;

    try {
      return await this.prisma.$transaction(async (prisma) => {
        const existingUser = await prisma.user.findUnique({
          where: { email: input.email },
        });

        const user = existingUser
          ? await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                emailVerifiedAt: existingUser.emailVerifiedAt || new Date(),
                avatar: existingUser.avatar || input.avatar,
              },
            })
          : await prisma.user.create({
              data: {
                email: input.email,
                name: input.name,
                avatar: input.avatar,
                emailVerifiedAt: new Date(),
                roles: {
                  create: { role: { connect: { key: "member" } } },
                },
              },
            });

        await prisma.socialAccount.create({
          data: {
            userId: user.id,
            provider: "google",
            providerAccountId: input.providerAccountId,
          },
        });

        return user;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const account = await this.prisma.socialAccount.findUnique({
          where: {
            provider_providerAccountId: {
              provider: "google",
              providerAccountId: input.providerAccountId,
            },
          },
          include: { user: true },
        });
        if (account) return account.user;
      }
      throw error;
    }
  }

  private async toAuthenticatedUser(user: {
    id: number;
    name: string;
    email: string;
    emailVerifiedAt: Date | null;
    avatar: string | null;
    status: string;
    tokenVersion: number;
  }): Promise<AuthenticatedUser> {
    const authorizationRecord = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: userAuthorizationInclude,
    });
    if (!authorizationRecord) {
      throw new UnauthorizedException("Tài khoản không còn tồn tại.");
    }
    const authorization = resolveUserAuthorization(authorizationRecord);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt,
      avatar: user.avatar,
      status: user.status,
      ...authorization,
      tokenVersion: user.tokenVersion,
    };
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private normalizeLegacyHash(passwordHash: string) {
    return passwordHash.startsWith("$2y$")
      ? `$2b$${passwordHash.slice(4)}`
      : passwordHash;
  }
}
