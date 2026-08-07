import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
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
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";

import { parseDurationMs } from "../../config/env.validation";
import {
  resolveUserAuthorization,
  userAuthorizationInclude,
} from "../authorization/user-authorization";
import { BusinessSettingsService } from "../business-settings/business-settings.service";
import { PrismaService } from "../../database/prisma/prisma.service";
import type {
  AccessJwtPayload,
  AuthMethod,
  AuthenticatedUser,
  RefreshJwtPayload,
  SessionContext,
} from "./auth.types";
import {
  AUTH_ERROR_CODES,
  unauthorizedAuthError,
} from "./auth-errors";
import type { RegisterDto } from "./dto/register.dto";
import { PasswordResetMailer } from "./password-reset-mailer.service";

const INVALID_CREDENTIALS_MESSAGE = "Email hoặc mật khẩu không chính xác.";
const DUMMY_PASSWORD_HASH =
  "$2b$12$M6oVeaKyMkEGNAg1J4aQSe8d8r94bHIpATvndSBH0cmJb9aJw8R5u";
const PASSWORD_RESET_RESPONSE =
  "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.";

@Injectable()
export class AuthService {
  private readonly googleClient = new OAuth2Client();
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly passwordResetMailer: PasswordResetMailer,
    private readonly businessSettings: BusinessSettingsService,
  ) {}

  async register(dto: RegisterDto) {
    const settings = await this.businessSettings.getRuntime();
    if (!settings.registrationEnabled || settings.maintenanceMode) {
      throw new ServiceUnavailableException(
        settings.maintenanceMode
          ? "Hệ thống đang bảo trì. Vui lòng quay lại sau."
          : "Hệ thống đang tạm dừng đăng ký tài khoản mới.",
      );
    }
    const email = this.normalizeEmail(dto.email);
    const referrer = dto.referralCode
      ? await this.prisma.user.findFirst({
          where: {
            referralCode: dto.referralCode,
            status: "active",
          },
          select: { id: true },
        })
      : null;
    if (dto.referralCode && !referrer) {
      throw new BadRequestException(
        "Mã giới thiệu không tồn tại hoặc không còn hiệu lực.",
      );
    }
    const passwordHash = await hash(dto.password, 12);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const user = await this.prisma.user.create({
          data: {
            name: dto.name.trim(),
            email,
            passwordHash,
            emailVerifiedAt: settings.emailVerificationRequired
              ? null
              : new Date(),
            status: "active",
            referralCode: this.generateReferralCode(),
            referredById: referrer?.id,
            roles: {
              create: { role: { connect: { key: "member" } } },
            },
          },
        });
        if (settings.emailVerificationRequired) {
          try {
            await this.issueEmailVerification(user, null);
          } catch (error) {
            await this.prisma.user.delete({ where: { id: user.id } });
            throw error;
          }
        }
        return {
          ...this.toPublicUser(await this.toAuthenticatedUser(user)),
          requiresEmailVerification: settings.emailVerificationRequired,
        };
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          const emailExists = await this.prisma.user.findUnique({
            where: { email },
            select: { id: true },
          });
          if (emailExists) {
            throw new ConflictException("Email đã được sử dụng.");
          }
          continue;
        }
        throw error;
      }
    }

    throw new ServiceUnavailableException(
      "Không thể tạo mã giới thiệu. Vui lòng thử lại.",
    );
  }

  async requestPasswordReset(emailInput: string, context: SessionContext) {
    const email = this.normalizeEmail(emailInput);
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
      },
    });

    if (!user || user.status !== "active") {
      return { message: PASSWORD_RESET_RESPONSE };
    }

    const token = randomBytes(32).toString("base64url");
    const tokenHash = this.hashOpaqueToken(token);
    const expiresInMinutes = this.passwordResetLifetimeMinutes();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInMinutes * 60_000);

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: now },
      }),
      this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
          requestedIp: context.ipAddress,
        },
      }),
    ]);

    const resetUrl = new URL(this.passwordResetUrl());
    resetUrl.searchParams.set("token", token);

    try {
      await this.passwordResetMailer.sendPasswordReset({
        to: user.email,
        name: user.name,
        resetUrl: resetUrl.toString(),
        expiresInMinutes,
      });
    } catch (error) {
      await this.prisma.passwordResetToken.deleteMany({ where: { tokenHash } });
      this.logger.error(
        "Yêu cầu đặt lại mật khẩu đã được tiếp nhận nhưng email không gửi được.",
        error instanceof Error ? error.stack : undefined,
      );
    }

    return { message: PASSWORD_RESET_RESPONSE };
  }

  async requestEmailVerification(emailInput: string, context: SessionContext) {
    const email = this.normalizeEmail(emailInput);
    const settings = await this.businessSettings.getRuntime();
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, emailVerifiedAt: true, status: true },
    });
    if (
      settings.emailVerificationRequired &&
      user?.status === "active" &&
      !user.emailVerifiedAt
    ) {
      await this.issueEmailVerification(user, context.ipAddress);
    }
    return {
      message:
        "Nếu tài khoản cần xác minh, chúng tôi đã gửi một liên kết mới đến email của bạn.",
    };
  }

  async verifyEmail(token: string) {
    const tokenHash = this.hashOpaqueToken(token);
    const now = new Date();
    await this.prisma.$transaction(async (prisma) => {
      const verification = await prisma.emailVerificationToken.findFirst({
        where: {
          tokenHash,
          usedAt: null,
          expiresAt: { gt: now },
          user: { status: "active" },
        },
        select: { id: true, userId: true },
      });
      if (!verification) {
        throw new BadRequestException(
          "Liên kết xác minh không hợp lệ hoặc đã hết hạn.",
        );
      }
      const claimed = await prisma.emailVerificationToken.updateMany({
        where: { id: verification.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (claimed.count !== 1) {
        throw new BadRequestException(
          "Liên kết xác minh không hợp lệ hoặc đã hết hạn.",
        );
      }
      await prisma.user.update({
        where: { id: verification.userId },
        data: { emailVerifiedAt: now },
      });
      await prisma.emailVerificationToken.updateMany({
        where: { userId: verification.userId, usedAt: null },
        data: { usedAt: now },
      });
    });
    return { message: "Email đã được xác minh. Bạn có thể đăng nhập." };
  }

  async resetPassword(token: string, password: string) {
    const tokenHash = this.hashOpaqueToken(token);
    const now = new Date();
    const passwordHash = await hash(password, 12);

    await this.prisma.$transaction(async (prisma) => {
      const resetToken = await prisma.passwordResetToken.findFirst({
        where: {
          tokenHash,
          usedAt: null,
          expiresAt: { gt: now },
          user: { status: "active" },
        },
        select: {
          id: true,
          userId: true,
          user: { select: { emailVerifiedAt: true } },
        },
      });
      if (!resetToken) {
        throw new BadRequestException(
          "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.",
        );
      }

      const claimed = await prisma.passwordResetToken.updateMany({
        where: {
          id: resetToken.id,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: { usedAt: now },
      });
      if (claimed.count !== 1) {
        throw new BadRequestException(
          "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.",
        );
      }

      await prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash,
          emailVerifiedAt: resetToken.user.emailVerifiedAt ?? now,
          tokenVersion: { increment: 1 },
        },
      });
      await prisma.authSession.updateMany({
        where: { userId: resetToken.userId, revokedAt: null },
        data: { revokedAt: now },
      });
      await prisma.passwordResetToken.updateMany({
        where: { userId: resetToken.userId, usedAt: null },
        data: { usedAt: now },
      });
    });

    return {
      message: "Mật khẩu đã được cập nhật. Vui lòng đăng nhập lại.",
    };
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
      !passwordMatches
    ) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const settings = await this.businessSettings.getRuntime();
    if (settings.emailVerificationRequired && !user.emailVerifiedAt) {
      throw new ForbiddenException({
        code: "EMAIL_VERIFICATION_REQUIRED",
        message: "Bạn cần xác minh email trước khi đăng nhập.",
      });
    }

    return this.toAuthenticatedUser(user);
  }

  async createSession(
    user: AuthenticatedUser,
    context: SessionContext,
    rememberMe = false,
    authMethod: AuthMethod = "password",
    impersonator?: { userId: number; sessionId: string },
  ) {
    const sessionId = randomUUID();
    const rotationCounter = 0;
    const expiresAt = new Date(Date.now() + this.refreshLifetimeMs());
    const tokens = await this.issueTokenPair(
      user,
      sessionId,
      rotationCounter,
      rememberMe,
    );

    await this.prisma.authSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        authMethod,
        impersonatorUserId: impersonator?.userId,
        impersonatorSessionId: impersonator?.sessionId,
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
      session.user.status !== "active"
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

    const user = await this.attachImpersonation(
      await this.toAuthenticatedUser(session.user),
      session.impersonatorUserId,
    );
    const nextRotation = session.rotationCounter + 1;
    const tokens = await this.issueTokenPair(
      user,
      session.id,
      nextRotation,
      payload.rememberMe === true,
    );
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

  async loginWithGoogle(idToken: string, referralCode?: string) {
    const settings = await this.businessSettings.getRuntime();
    if (!settings.googleLoginEnabled) {
      throw new ServiceUnavailableException(
        "Đăng nhập Google đang tạm dừng.",
      );
    }
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
      referralCode,
      allowRegistration: settings.registrationEnabled,
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
      impersonation: user.impersonation ?? null,
    };
  }

  async startImpersonation(
    actor: AuthenticatedUser,
    targetUserId: number,
    context: SessionContext,
  ) {
    if (!actor.sessionId || actor.impersonation) {
      throw new ForbiddenException(
        "Không thể bắt đầu một phiên impersonation từ phiên hiện tại.",
      );
    }
    if (actor.id === targetUserId) {
      throw new BadRequestException(
        "Bạn không thể đăng nhập với tư cách chính mình.",
      );
    }

    const targetRecord = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: userAuthorizationInclude,
    });
    if (!targetRecord) {
      throw new NotFoundException("Không tìm thấy người dùng.");
    }
    if (targetRecord.status !== "active") {
      throw new BadRequestException(
        "Chỉ có thể đăng nhập với tư cách tài khoản đang hoạt động.",
      );
    }

    const target = await this.toAuthenticatedUser(targetRecord);
    if (target.permissions.includes("admin.access")) {
      throw new ForbiddenException(
        "Không thể impersonate tài khoản có quyền quản trị.",
      );
    }

    const result = await this.createSession(
      {
        ...target,
        impersonation: {
          actorId: actor.id,
          actorName: actor.name,
          actorEmail: actor.email,
        },
      },
      context,
      false,
      "impersonation",
      { userId: actor.id, sessionId: actor.sessionId },
    );
    await this.revokeSession(actor.sessionId);
    return result;
  }

  async stopImpersonation(
    currentUser: AuthenticatedUser,
    context: SessionContext,
  ) {
    if (!currentUser.sessionId || !currentUser.impersonation) {
      throw new BadRequestException("Phiên hiện tại không phải impersonation.");
    }

    const actorRecord = await this.prisma.user.findUnique({
      where: { id: currentUser.impersonation.actorId },
      include: userAuthorizationInclude,
    });
    if (!actorRecord || actorRecord.status !== "active") {
      throw new ForbiddenException(
        "Tài khoản quản trị gốc không còn khả dụng.",
      );
    }

    const actor = await this.toAuthenticatedUser(actorRecord);
    if (!actor.permissions.includes("admin.access")) {
      throw new ForbiddenException(
        "Tài khoản quản trị gốc không còn quyền truy cập admin.",
      );
    }

    const result = await this.createSession(
      actor,
      context,
      false,
      "impersonation_return",
    );
    await this.revokeSession(currentUser.sessionId);
    return result;
  }

  private async issueTokenPair(
    user: AuthenticatedUser,
    sessionId: string,
    rotationCounter: number,
    rememberMe: boolean,
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
      rememberMe,
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

  private generateReferralCode() {
    return randomUUID().replaceAll("-", "").slice(0, 12);
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

  private async findOrCreateGoogleUser(input: {
    providerAccountId: string;
    email: string;
    name: string;
    avatar: string | null;
    referralCode?: string;
    allowRegistration: boolean;
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

        if (!existingUser && !input.allowRegistration) {
          throw new ServiceUnavailableException(
            "Hệ thống đang tạm dừng đăng ký tài khoản mới.",
          );
        }

        const referrer =
          !existingUser && input.referralCode
            ? await prisma.user.findFirst({
                where: {
                  referralCode: input.referralCode,
                  status: "active",
                },
                select: { id: true },
              })
            : null;
        if (!existingUser && input.referralCode && !referrer) {
          throw new BadRequestException(
            "Mã giới thiệu không tồn tại hoặc không còn hiệu lực.",
          );
        }

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
                referralCode: this.generateReferralCode(),
                referredById: referrer?.id,
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

  private async attachImpersonation(
    user: AuthenticatedUser,
    impersonatorUserId: number | null,
  ): Promise<AuthenticatedUser> {
    if (!impersonatorUserId) return user;
    const actor = await this.prisma.user.findUnique({
      where: { id: impersonatorUserId },
      select: { id: true, name: true, email: true },
    });
    if (!actor) {
      throw new UnauthorizedException(
        "Phiên impersonation không còn hợp lệ.",
      );
    }
    return {
      ...user,
      impersonation: {
        actorId: actor.id,
        actorName: actor.name,
        actorEmail: actor.email,
      },
    };
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private hashOpaqueToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private async issueEmailVerification(
    user: { id: number; name: string; email: string },
    requestedIp: string | null,
  ) {
    const token = randomBytes(32).toString("base64url");
    const tokenHash = this.hashOpaqueToken(token);
    const expiresInHours = 24;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInHours * 60 * 60_000);
    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: now },
      }),
      this.prisma.emailVerificationToken.create({
        data: { userId: user.id, tokenHash, expiresAt, requestedIp },
      }),
    ]);

    const verificationUrl = new URL(this.emailVerificationUrl());
    verificationUrl.searchParams.set("token", token);
    try {
      await this.passwordResetMailer.sendEmailVerification({
        to: user.email,
        name: user.name,
        verificationUrl: verificationUrl.toString(),
        expiresInHours,
      });
    } catch (error) {
      await this.prisma.emailVerificationToken.deleteMany({ where: { tokenHash } });
      throw error;
    }
  }

  private emailVerificationUrl() {
    const frontendOrigin = this.configService
      .getOrThrow<string>("FRONTEND_ORIGIN")
      .split(",")[0]
      .trim();
    return new URL("/verify-email", frontendOrigin).toString();
  }

  private passwordResetLifetimeMinutes() {
    const value = Number(
      this.configService.get<string>("PASSWORD_RESET_TOKEN_TTL_MINUTES") || 30,
    );
    return Number.isInteger(value) && value >= 5 && value <= 1_440 ? value : 30;
  }

  private passwordResetUrl() {
    const configured = this.configService
      .get<string>("PASSWORD_RESET_URL")
      ?.trim();
    if (configured) return configured;

    const frontendOrigin = this.configService
      .getOrThrow<string>("FRONTEND_ORIGIN")
      .split(",")[0]
      .trim();
    return new URL("/reset-password", frontendOrigin).toString();
  }

  private normalizeLegacyHash(passwordHash: string) {
    return passwordHash.startsWith("$2y$")
      ? `$2b$${passwordHash.slice(4)}`
      : passwordHash;
  }
}
