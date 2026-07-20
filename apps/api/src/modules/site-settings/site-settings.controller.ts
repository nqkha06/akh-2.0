import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";

import type { AuthenticatedUser } from "../auth/auth.types";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { UpdateWebsiteSettingsDto } from "./dto/update-website-settings.dto";
import { SiteSettingsService } from "./site-settings.service";

type AdminRequest = Request & { user: AuthenticatedUser };

@Controller()
export class SiteSettingsController {
  constructor(private readonly settingsService: SiteSettingsService) {}

  @Get("site-config")
  getPublicSettings() {
    return this.settingsService.getPublicSettings();
  }

  @Get("admin/settings/appearance")
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions("settings.read")
  getAdminSettings() {
    return this.settingsService.getAdminSettings();
  }

  @Patch("admin/settings/appearance")
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions("settings.update")
  update(
    @Req() request: AdminRequest,
    @Body() dto: UpdateWebsiteSettingsDto,
  ) {
    return this.settingsService.update(dto, request.user.id);
  }
}
