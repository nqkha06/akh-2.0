import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
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
  CreateEmailTemplateDto,
  ListEmailTemplatesQueryDto,
  PreviewEmailTemplateDto,
  TestSendEmailTemplateDto,
  UpdateEmailTemplateDto,
} from "./dto/email-templates.dto";
import { EmailTemplatesService } from "./email-templates.service";

@Controller("admin/emails/templates")
@UseGuards(JwtAccessGuard, PermissionsGuard)
export class EmailTemplatesController {
  constructor(private readonly templates: EmailTemplatesService) {}

  @Get()
  @Permissions("emails.templates.read")
  list(@Query() query: ListEmailTemplatesQueryDto) {
    return this.templates.list(query);
  }

  @Get(":id")
  @Permissions("emails.templates.read")
  find(@Param("id", ParseIntPipe) id: number) {
    return this.templates.find(id);
  }

  @Post()
  @Permissions("emails.templates.create")
  create(
    @Req() request: Request,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateEmailTemplateDto,
  ) {
    return this.templates.create(dto, user.id, auditRequestContext(request));
  }

  @Patch(":id")
  @Permissions("emails.templates.update")
  update(
    @Req() request: Request,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateEmailTemplateDto,
  ) {
    return this.templates.update(id, dto, user.id, auditRequestContext(request));
  }

  @Delete(":id")
  @Permissions("emails.templates.delete")
  archive(
    @Req() request: Request,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.templates.archive(id, user.id, auditRequestContext(request));
  }

  @Post(":id/preview")
  @Permissions("emails.templates.read")
  preview(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: PreviewEmailTemplateDto,
  ) {
    return this.templates.preview(id, dto);
  }

  @Post(":id/test-send")
  @Permissions("emails.test.send")
  testSend(
    @Req() request: Request,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: TestSendEmailTemplateDto,
  ) {
    return this.templates.testSend(
      id,
      dto,
      user.id,
      auditRequestContext(request),
    );
  }

  @Get(":id/versions")
  @Permissions("emails.templates.read")
  versions(@Param("id", ParseIntPipe) id: number) {
    return this.templates.versions(id);
  }

  @Post(":id/restore-version/:version")
  @Permissions("emails.templates.update")
  restoreVersion(
    @Req() request: Request,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseIntPipe) id: number,
    @Param("version", ParseIntPipe) version: number,
  ) {
    return this.templates.restoreVersion(
      id,
      version,
      user.id,
      auditRequestContext(request),
    );
  }
}
