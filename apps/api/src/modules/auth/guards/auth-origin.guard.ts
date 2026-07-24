import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";

@Injectable()
export class AuthOriginGuard implements CanActivate {
  private readonly allowedOrigins: Set<string>;

  constructor(configService: ConfigService) {
    this.allowedOrigins = new Set(
      configService
        .getOrThrow<string>("FRONTEND_ORIGIN")
        .split(",")
        .map((origin) => origin.trim().replace(/\/$/, ""))
        .filter(Boolean),
    );
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const origin = request.headers.origin?.replace(/\/$/, "");
    const requestOrigin = `${request.protocol}://${request.get("host")}`;

    // Server-to-server calls do not carry Origin. Browser cookie calls do.
    if (
      !origin ||
      origin === requestOrigin ||
      this.allowedOrigins.has(origin)
    ) {
      return true;
    }
    throw new ForbiddenException("Origin không được phép.");
  }
}
