import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";

import { auditRequestContext } from "../../common/http/audit-request-context";
import { CurrentUser } from "../../common/http/current-user.decorator";
import type { AuthenticatedUser } from "../auth/auth.types";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import {
  CreateEmailPreferenceTopicDto,
  UpdateEmailPreferenceTopicDto,
} from "./dto/email-preferences.dto";
import { EmailPreferencesService } from "./email-preferences.service";

@Controller("admin/emails/preference-topics")
@UseGuards(JwtAccessGuard, PermissionsGuard)
export class EmailPreferencesController {
  constructor(private readonly preferences: EmailPreferencesService) {}

  @Get()
  @Permissions("emails.read")
  list() {
    return this.preferences.list();
  }

  @Post()
  @Permissions("emails.preferences.manage")
  create(
    @Req() request: Request,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateEmailPreferenceTopicDto,
  ) {
    return this.preferences.create(dto, user.id, auditRequestContext(request));
  }

  @Patch(":id")
  @Permissions("emails.preferences.manage")
  update(
    @Req() request: Request,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateEmailPreferenceTopicDto,
  ) {
    return this.preferences.update(id, dto, user.id, auditRequestContext(request));
  }
}
