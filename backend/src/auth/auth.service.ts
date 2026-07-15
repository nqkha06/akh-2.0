import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService, type JwtSignOptions } from "@nestjs/jwt";
import { Prisma } from "@prisma/client";
import { compare } from "bcryptjs";
import { OAuth2Client } from "google-auth-library";

import { PrismaService } from "../prisma/prisma.service";
import type { AuthenticatedUser, JwtPayload } from "./auth.types";

@Injectable()
export class AuthService {
  private readonly googleClient = new OAuth2Client();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateCredentials(emailInput: string, password: string) {
    const email = this.normalizeEmail(emailInput);
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (
      !user?.passwordHash ||
      user.status !== "active" ||
      !(await compare(password, this.normalizeLegacyHash(user.passwordHash)))
    ) {
      throw new UnauthorizedException("Email hoặc mật khẩu không đúng.");
    }

    return this.toAuthenticatedUser(user);
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

    return this.issueToken(this.toAuthenticatedUser(user));
  }

  async issueToken(user: AuthenticatedUser) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      version: user.tokenVersion,
    };
    const expiresIn = this.configService.get<string>("JWT_EXPIRES_IN", "8h");
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: expiresIn as JwtSignOptions["expiresIn"],
    });

    return {
      accessToken,
      tokenType: "Bearer",
      expiresIn,
      user: this.toPublicUser(user),
    };
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
    };
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

  private toAuthenticatedUser(user: {
    id: number;
    name: string;
    email: string;
    emailVerifiedAt: Date | null;
    avatar: string | null;
    status: string;
    role: string;
    tokenVersion: number;
  }): AuthenticatedUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt,
      avatar: user.avatar,
      status: user.status,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private normalizeLegacyHash(hash: string) {
    return hash.startsWith("$2y$") ? `$2b$${hash.slice(4)}` : hash;
  }
}
