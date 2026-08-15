import { Body, Controller, Get, Patch, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";

import { auditRequestContext } from "../../common/http/audit-request-context";
import { CurrentUser } from "../../common/http/current-user.decorator";
import type { AuthenticatedUser } from "../auth/auth.types";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { UpdateEmailSettingsDto } from "./dto/email-settings.dto";
import { EmailSettingsService } from "./email-settings.service";

@Controller("admin/emails/settings")
@UseGuards(JwtAccessGuard, PermissionsGuard)
export class EmailSettingsController {
  constructor(private readonly settings: EmailSettingsService) {}

  @Get()
  @Permissions("emails.read")
  get() {
    return this.settings.get();
  }

  @Patch()
  @Permissions("emails.settings.update")
  update(
    @Req() request: Request,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateEmailSettingsDto,
  ) {
    return this.settings.update(dto, user.id, auditRequestContext(request));
  }

  @Post("check-connection")
  @Permissions("emails.settings.update")
  checkConnection(
    @Req() request: Request,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.settings.checkConnection(user.id, auditRequestContext(request));
  }
}
