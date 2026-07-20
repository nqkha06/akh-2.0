import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthOriginGuard } from "./guards/auth-origin.guard";
import { AuthRateLimitGuard } from "./guards/auth-rate-limit.guard";
import { PermissionsGuard } from "./guards/permissions.guard";
import { RolesGuard } from "./guards/roles.guard";
import { JwtAccessStrategy } from "./strategies/jwt-access.strategy";
import { JwtRefreshStrategy } from "./strategies/jwt-refresh.strategy";
import { LocalStrategy } from "./strategies/local.strategy";

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    AuthOriginGuard,
    PermissionsGuard,
    RolesGuard,
    {
      provide: APP_GUARD,
      useClass: AuthRateLimitGuard,
    },
  ],
  exports: [AuthService, PermissionsGuard, RolesGuard],
})
export class AuthModule {}
