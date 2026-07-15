import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";

import { AuthService } from "./auth.service";
import type { AuthenticatedUser } from "./auth.types";
import { GoogleLoginDto } from "./dto/google-login.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { LocalAuthGuard } from "./guards/local-auth.guard";

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() _loginDto: LoginDto, @Req() request: AuthenticatedRequest) {
    return this.authService.issueToken(request.user);
  }

  @Post("google")
  @HttpCode(HttpStatus.OK)
  loginWithGoogle(@Body() body: GoogleLoginDto) {
    return this.authService.loginWithGoogle(body.idToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@Req() request: AuthenticatedRequest) {
    return this.authService.toPublicUser(request.user);
  }
}
