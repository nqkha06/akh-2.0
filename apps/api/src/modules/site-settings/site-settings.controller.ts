import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser } from "../../common/http/current-user.decorator";
import type { AuthenticatedUser } from "../auth/auth.types";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { UpdateWebsiteSettingsDto } from "./dto/update-website-settings.dto";
import { SiteSettingsService } from "./site-settings.service";

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
  @Permissions("settings.update", "admin-media.read")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateWebsiteSettingsDto,
  ) {
    return this.settingsService.update(dto, user.id);
  }
}
