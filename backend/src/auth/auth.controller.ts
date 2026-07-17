import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request, Response } from "express";

import { parseDurationMs } from "../config/env.validation";
import {
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
import { GoogleLoginDto } from "./dto/google-login.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { AuthOriginGuard } from "./guards/auth-origin.guard";
import { JwtAccessGuard } from "./guards/jwt-access.guard";
import { JwtRefreshGuard } from "./guards/jwt-refresh.guard";
import { LocalAuthGuard } from "./guards/local-auth.guard";

type AccessRequest = Request & { user: AuthenticatedUser };
type RefreshRequest = Request & { user: RefreshAuthenticatedRequestUser };

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
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
    @Body() _loginDto: LoginDto,
    @Req() request: AccessRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.createSession(
      request.user,
      this.sessionContext(request),
    );
    this.setRefreshCookie(response, result.refreshToken);
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
    const user = await this.authService.loginWithGoogle(body.idToken);
    const result = await this.authService.createSession(
      user,
      this.sessionContext(request),
    );
    this.setRefreshCookie(response, result.refreshToken);
    return result.response;
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
    this.setRefreshCookie(response, result.refreshToken);
    return result.response;
  }

  @Post("logout")
  @UseGuards(AuthOriginGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.authService.logout(
      readCookie(request, refreshCookieName(this.configService)),
    );
    this.clearRefreshCookie(response);
  }

  @Post("logout-all")
  @UseGuards(AuthOriginGuard, JwtAccessGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(
    @Req() request: AccessRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logoutAll(request.user.id);
    this.clearRefreshCookie(response);
  }

  @Get("me")
  @UseGuards(JwtAccessGuard)
  me(@Req() request: AccessRequest) {
    return this.authService.toPublicUser(request.user);
  }

  private setRefreshCookie(response: Response, token: string) {
    response.cookie(refreshCookieName(this.configService), token, {
      ...refreshCookieOptions(this.configService),
      maxAge: parseDurationMs(
        this.configService.getOrThrow<string>("JWT_REFRESH_EXPIRES_IN"),
      ),
    });
  }

  private clearRefreshCookie(response: Response) {
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
