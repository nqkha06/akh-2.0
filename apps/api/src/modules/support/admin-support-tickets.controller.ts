import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Request, Response } from "express";

import type { AuthenticatedUser } from "../auth/auth.types";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import {
  ListSupportTicketsQueryDto,
  ReplySupportTicketDto,
  UpdateSupportTicketDto,
} from "./dto/support-ticket.dto";
import { SupportTicketsService } from "./support-tickets.service";

type AdminRequest = Request & { user: AuthenticatedUser };

@Controller("admin/support/tickets")
@UseGuards(JwtAccessGuard, PermissionsGuard)
export class AdminSupportTicketsController {
  constructor(private readonly tickets: SupportTicketsService) {}

  @Get()
  @Permissions("support.read")
  findAll(
    @Req() request: AdminRequest,
    @Query() query: ListSupportTicketsQueryDto,
  ) {
    return this.tickets.listForAdmin(query, request.user.id);
  }

  @Get(":id")
  @Permissions("support.read")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.tickets.findForAdmin(id);
  }

  @Post(":id/replies")
  @Permissions("support.reply")
  reply(
    @Req() request: AdminRequest,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ReplySupportTicketDto,
  ) {
    return this.tickets.replyForAdmin(request.user.id, id, dto.content);
  }

  @Patch(":id")
  @Permissions("support.manage")
  update(
    @Req() request: AdminRequest,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateSupportTicketDto,
  ) {
    return this.tickets.updateForAdmin(request.user.id, id, dto);
  }

  @Get(":id/attachments/:attachmentId")
  @Permissions("support.read")
  async attachment(
    @Param("id", ParseIntPipe) id: number,
    @Param("attachmentId") attachmentId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { attachment, buffer } =
      await this.tickets.attachmentForAdmin(id, attachmentId);
    response.set({
      "Content-Type": attachment.mimeType,
      "Content-Length": String(attachment.size),
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`,
      "Cache-Control": "private, no-store",
    });
    return buffer;
  }
}
