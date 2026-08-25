import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes } from "@nestjs/swagger";
import { ABSOLUTE_HTTP_UPLOAD_MAX_BYTES } from "@stu/contracts";
import type { Request, Response } from "express";
import { memoryStorage } from "multer";

import { parseDurationMs } from "../../config/env.validation";
import {
  accessCookieName,
  accessCookieOptions,
  readCookie,
  refreshCookieName,
  refreshCookieOptions,
} from "./auth-cookie";
import { AuthService } from "./auth.service";
import type {
  AuthenticatedUser,
  RefreshAuthenticatedRequestUser,
  SessionContext,
} from "./auth.types";
import { AuthRateLimit } from "./decorators/auth-rate-limit.decorator";
import { Permissions } from "./decorators/permissions.decorator";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { GoogleLoginDto } from "./dto/google-login.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { AuthOriginGuard } from "./guards/auth-origin.guard";
import { JwtAccessGuard } from "./guards/jwt-access.guard";
import { JwtRefreshGuard } from "./guards/jwt-refresh.guard";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { PermissionsGuard } from "./guards/permissions.guard";
import { ProfileAvatarStorageService } from "./profile-avatar-storage.service";

type AccessRequest = Request & { user: AuthenticatedUser };
type RefreshRequest = Request & { user: RefreshAuthenticatedRequestUser };

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly profileAvatars: ProfileAvatarStorageService,
  ) {}

  @Post("register")
  @UseGuards(AuthOriginGuard)
  @AuthRateLimit(5, 15 * 60_000)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  @UseGuards(AuthOriginGuard, LocalAuthGuard)
  @AuthRateLimit(10, 15 * 60_000)
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: AccessRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.createSession(
      request.user,
      this.sessionContext(request),
      loginDto.rememberMe === true,
    );
    this.setAuthCookies(
      response,
      result.response.accessToken,
      result.refreshToken,
      loginDto.rememberMe === true,
    );
    return result.response;
  }

  @Post("google")
  @UseGuards(AuthOriginGuard)
  @AuthRateLimit(10, 15 * 60_000)
  @HttpCode(HttpStatus.OK)
  async loginWithGoogle(
    @Body() body: GoogleLoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.loginWithGoogle(
      body.idToken,
      body.referralCode,
    );
    const result = await this.authService.createSession(
      user,
      this.sessionContext(request),
      body.rememberMe === true,
      "google",
    );
    this.setAuthCookies(
      response,
      result.response.accessToken,
      result.refreshToken,
      body.rememberMe === true,
    );
    return result.response;
  }

  @Post("forgot-password")
  @UseGuards(AuthOriginGuard)
  @AuthRateLimit(5, 15 * 60_000)
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() body: ForgotPasswordDto, @Req() request: Request) {
    return this.authService.requestPasswordReset(
      body.email,
      this.sessionContext(request),
    );
  }

  @Post("reset-password")
  @UseGuards(AuthOriginGuard)
  @AuthRateLimit(10, 15 * 60_000)
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() body: ResetPasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.resetPassword(
      body.token,
      body.password,
    );
    this.clearAuthCookies(response);
    return result;
  }

  @Post("change-password")
  @UseGuards(AuthOriginGuard, JwtAccessGuard)
  @AuthRateLimit(10, 15 * 60_000)
  @HttpCode(HttpStatus.OK)
  changePassword(
    @Body() body: ChangePasswordDto,
    @Req() request: AccessRequest,
  ) {
    return this.authService.changePassword(
      request.user,
      body.currentPassword,
      body.newPassword,
      this.sessionContext(request),
    );
  }

  @Post("verify-email")
  @UseGuards(AuthOriginGuard)
  @AuthRateLimit(10, 15 * 60_000)
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body.token);
  }

  @Post("resend-verification")
  @UseGuards(AuthOriginGuard)
  @AuthRateLimit(5, 15 * 60_000)
  @HttpCode(HttpStatus.OK)
  resendVerification(
    @Body() body: ForgotPasswordDto,
    @Req() request: Request,
  ) {
    return this.authService.requestEmailVerification(
      body.email,
      this.sessionContext(request),
    );
  }

  @Post("refresh")
  @UseGuards(AuthOriginGuard, JwtRefreshGuard)
  @AuthRateLimit(30, 60_000)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: RefreshRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.refresh(
      request.user.payload,
      request.user.refreshToken,
      this.sessionContext(request),
    );
    this.setAuthCookies(
      response,
      result.response.accessToken,
      result.refreshToken,
      request.user.payload.rememberMe === true,
    );
    return result.response;
  }

  @Post("logout")
  @UseGuards(AuthOriginGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.authService.logout(
      readCookie(request, refreshCookieName(this.configService)),
    );
    this.clearAuthCookies(response);
  }

  @Post("impersonation/stop")
  @UseGuards(AuthOriginGuard, JwtAccessGuard)
  @AuthRateLimit(20, 60_000)
  @HttpCode(HttpStatus.OK)
  async stopImpersonation(
    @Req() request: AccessRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.stopImpersonation(
      request.user,
      this.sessionContext(request),
    );
    this.setAuthCookies(
      response,
      result.response.accessToken,
      result.refreshToken,
      false,
    );
    return result.response;
  }

  @Post("impersonation/:id")
  @UseGuards(AuthOriginGuard, JwtAccessGuard, PermissionsGuard)
  @Permissions("users.impersonate")
  @AuthRateLimit(20, 60_000)
  @HttpCode(HttpStatus.OK)
  async startImpersonation(
    @Param("id", ParseIntPipe) id: number,
    @Req() request: AccessRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.startImpersonation(
      request.user,
      id,
      this.sessionContext(request),
    );
    this.setAuthCookies(
      response,
      result.response.accessToken,
      result.refreshToken,
      false,
    );
    return result.response;
  }

  @Get("me")
  @UseGuards(JwtAccessGuard)
  me(@Req() request: AccessRequest) {
    return this.authService.toPublicUser(request.user);
  }

  @Patch("me")
  @UseGuards(AuthOriginGuard, JwtAccessGuard)
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        name: { type: "string", minLength: 2, maxLength: 100 },
        removeAvatar: { type: "boolean" },
        avatar: { type: "string", format: "binary" },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor("avatar", {
      storage: memoryStorage(),
      limits: { fileSize: ABSOLUTE_HTTP_UPLOAD_MAX_BYTES, files: 1 },
    }),
  )
  updateMe(
    @Req() request: AccessRequest,
    @Body() body: UpdateProfileDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ) {
    return this.authService.updateProfile(request.user, body, avatar);
  }

  @Get("profile-avatars/:userId/:fileName")
  @Header("Cache-Control", "public, max-age=86400, immutable")
  async profileAvatar(
    @Param("userId", ParseIntPipe) userId: number,
    @Param("fileName") fileName: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const avatar = await this.profileAvatars.read(userId, fileName);
    response.set({
      "Content-Type": avatar.mimeType,
      "Content-Length": String(avatar.buffer.length),
      "X-Content-Type-Options": "nosniff",
    });
    return new StreamableFile(avatar.buffer);
  }

  private setAuthCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
    rememberMe: boolean,
  ) {
    const accessOptions = accessCookieOptions(this.configService);
    const refreshOptions = refreshCookieOptions(this.configService);

    response.cookie(accessCookieName(this.configService), accessToken, {
      ...accessOptions,
      ...(rememberMe
        ? {
            maxAge: parseDurationMs(
              this.configService.getOrThrow<string>("JWT_ACCESS_EXPIRES_IN"),
            ),
          }
        : {}),
    });
    response.cookie(refreshCookieName(this.configService), refreshToken, {
      ...refreshOptions,
      ...(rememberMe
        ? {
            maxAge: parseDurationMs(
              this.configService.getOrThrow<string>("JWT_REFRESH_EXPIRES_IN"),
            ),
          }
        : {}),
    });
  }

  private clearAuthCookies(response: Response) {
    response.clearCookie(
      accessCookieName(this.configService),
      accessCookieOptions(this.configService),
    );
    response.clearCookie(
      refreshCookieName(this.configService),
      refreshCookieOptions(this.configService),
    );
  }

  private sessionContext(request: Request): SessionContext {
    return {
      userAgent: request.get("user-agent")?.slice(0, 500) || null,
      ipAddress: request.ip?.slice(0, 64) || null,
    };
  }
}
