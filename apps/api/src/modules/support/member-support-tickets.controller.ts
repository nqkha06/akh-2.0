import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { memoryStorage } from "multer";
import { ABSOLUTE_HTTP_UPLOAD_MAX_BYTES } from "@stu/contracts";

import type { AuthenticatedUser } from "../auth/auth.types";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import {
  CreateSupportTicketDto,
  ReplySupportTicketDto,
} from "./dto/support-ticket.dto";
import { SupportTicketsService } from "./support-tickets.service";

type MemberRequest = Request & { user: AuthenticatedUser };

@Controller("member/support/tickets")
@UseGuards(JwtAccessGuard)
export class MemberSupportTicketsController {
  constructor(private readonly tickets: SupportTicketsService) {}

  @Get()
  findAll(@Req() request: MemberRequest) {
    return this.tickets.listForMember(request.user.id);
  }

  @Post()
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["category", "subject", "content"],
      properties: {
        category: {
          type: "string",
          enum: [
            "usage",
            "technical",
            "social_links",
            "files",
            "link_in_bio",
            "monetization",
            "withdrawal",
            "rewards",
            "account",
            "abuse",
            "other",
          ],
        },
        subject: { type: "string", minLength: 8, maxLength: 160 },
        content: { type: "string", minLength: 20, maxLength: 10_000 },
        relatedResource: { type: "string", maxLength: 500 },
        technicalInfo: { type: "string", maxLength: 4_000 },
        attachments: {
          type: "array",
          maxItems: 5,
          items: { type: "string", format: "binary" },
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor("attachments", 5, {
      storage: memoryStorage(),
      limits: { fileSize: ABSOLUTE_HTTP_UPLOAD_MAX_BYTES, files: 5 },
    }),
  )
  create(
    @Req() request: MemberRequest,
    @Body() dto: CreateSupportTicketDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ) {
    return this.tickets.createForMember(request.user.id, dto, files);
  }

  @Get(":id")
  findOne(
    @Req() request: MemberRequest,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.tickets.findForMember(request.user.id, id);
  }

  @Post(":id/replies")
  reply(
    @Req() request: MemberRequest,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ReplySupportTicketDto,
  ) {
    return this.tickets.replyForMember(request.user.id, id, dto.content);
  }

  @Get(":id/attachments/:attachmentId")
  async attachment(
    @Req() request: MemberRequest,
    @Param("id", ParseIntPipe) id: number,
    @Param("attachmentId") attachmentId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { attachment, buffer } =
      await this.tickets.attachmentForMember(
        request.user.id,
        id,
        attachmentId,
      );
    response.set({
      "Content-Type": attachment.mimeType,
      "Content-Length": String(attachment.size),
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`,
      "Cache-Control": "private, no-store",
    });
    return buffer;
  }
}
