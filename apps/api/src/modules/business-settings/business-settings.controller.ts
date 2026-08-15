import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../../common/http/current-user.decorator";
import type { AuthenticatedUser } from "../auth/auth.types";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { BusinessSettingsService } from "./business-settings.service";
import { UpdateBusinessSettingsDto } from "./dto/update-business-settings.dto";

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
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateBusinessSettingsDto,
  ) {
    return this.settings.update(dto, user.id);
  }
}
