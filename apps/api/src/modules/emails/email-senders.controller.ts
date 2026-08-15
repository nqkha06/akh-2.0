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
  CreateEmailSenderDto,
  ListEmailSendersQueryDto,
  UpdateEmailSenderDto,
} from "./dto/email-senders.dto";
import { EmailSendersService } from "./email-senders.service";

@Controller("admin/emails/senders")
@UseGuards(JwtAccessGuard, PermissionsGuard)
export class EmailSendersController {
  constructor(private readonly senders: EmailSendersService) {}

  @Get()
  @Permissions("emails.read")
  list(@Query() query: ListEmailSendersQueryDto) {
    return this.senders.list(query);
  }

  @Get(":id")
  @Permissions("emails.read")
  find(@Param("id", ParseIntPipe) id: number) {
    return this.senders.find(id);
  }

  @Post()
  @Permissions("emails.senders.manage")
  create(
    @Req() request: Request,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateEmailSenderDto,
  ) {
    return this.senders.create(dto, user.id, auditRequestContext(request));
  }

  @Patch(":id")
  @Permissions("emails.senders.manage")
  update(
    @Req() request: Request,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateEmailSenderDto,
  ) {
    return this.senders.update(id, dto, user.id, auditRequestContext(request));
  }

  @Post(":id/check-verification")
  @Permissions("emails.senders.manage")
  checkVerification(
    @Req() request: Request,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.senders.checkVerification(id, user.id, auditRequestContext(request));
  }

  @Post(":id/set-default")
  @Permissions("emails.senders.manage")
  setDefault(
    @Req() request: Request,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.senders.setDefault(id, user.id, auditRequestContext(request));
  }

  @Delete(":id")
  @Permissions("emails.senders.manage")
  remove(
    @Req() request: Request,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.senders.remove(id, user.id, auditRequestContext(request));
  }
}
