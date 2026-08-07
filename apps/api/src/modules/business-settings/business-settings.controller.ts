import { Body, Controller, Get, Patch, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";

import type { AuthenticatedUser } from "../auth/auth.types";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { BusinessSettingsService } from "./business-settings.service";
import { UpdateBusinessSettingsDto } from "./dto/update-business-settings.dto";

type AdminRequest = Request & { user: AuthenticatedUser };

@Controller()
export class BusinessSettingsController {
  constructor(private readonly settings: BusinessSettingsService) {}

  @Get("business-config")
  publicConfig() {
    return this.settings.getPublicSettings();
  }

  @Get("admin/settings/business")
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions("settings.read")
  adminSettings() {
    return this.settings.getAdminSettings();
  }

  @Patch("admin/settings/business")
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions("settings.update")
  update(
    @Req() request: AdminRequest,
    @Body() dto: UpdateBusinessSettingsDto,
  ) {
    return this.settings.update(dto, request.user.id);
  }
}
