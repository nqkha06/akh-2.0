import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";

import type { AuthenticatedUser } from "../auth/auth.types";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { AnnouncementsService } from "./announcements.service";
import { ListMemberAnnouncementsQueryDto } from "./dto/announcement.dto";

type MemberRequest = Request & { user: AuthenticatedUser };

@Controller("member/announcements")
@UseGuards(JwtAccessGuard)
export class MemberAnnouncementsController {
  constructor(private readonly announcements: AnnouncementsService) {}

  @Get()
  list(
    @Req() request: MemberRequest,
    @Query() query: ListMemberAnnouncementsQueryDto,
  ) {
    return this.announcements.listForMember(request.user.id, query, query.locale);
  }

  @Get("unread-count")
  unreadCount(@Req() request: MemberRequest) {
    return this.announcements.unreadCount(request.user.id);
  }

  @Get("active-banners")
  banners(@Req() request: MemberRequest, @Query("locale") locale?: string) {
    return this.announcements.activeBanners(request.user.id, locale);
  }

  @Get("active-modals")
  modals(@Req() request: MemberRequest, @Query("locale") locale?: string) {
    return this.announcements.activeModals(request.user.id, locale);
  }

  @Post("read-all")
  @HttpCode(200)
  readAll(@Req() request: MemberRequest) {
    return this.announcements.readAll(request.user.id);
  }

  @Get(":id")
  find(
    @Req() request: MemberRequest,
    @Param("id", ParseIntPipe) id: number,
    @Query("locale") locale?: string,
  ) {
    return this.announcements.findForMember(request.user.id, id, locale);
  }

  @Post(":id/seen")
  @HttpCode(200)
  seen(@Req() request: MemberRequest, @Param("id", ParseIntPipe) id: number) {
    return this.announcements.markSeen(request.user.id, id);
  }

  @Post(":id/read")
  @HttpCode(200)
  read(@Req() request: MemberRequest, @Param("id", ParseIntPipe) id: number) {
    return this.announcements.markRead(request.user.id, id);
  }

  @Post(":id/dismiss")
  @HttpCode(200)
  dismiss(@Req() request: MemberRequest, @Param("id", ParseIntPipe) id: number) {
    return this.announcements.dismiss(request.user.id, id);
  }

  @Post(":id/acknowledge")
  @HttpCode(200)
  acknowledge(@Req() request: MemberRequest, @Param("id", ParseIntPipe) id: number) {
    return this.announcements.acknowledge(request.user.id, id);
  }

  @Post(":id/click")
  @HttpCode(200)
  click(@Req() request: MemberRequest, @Param("id", ParseIntPipe) id: number) {
    return this.announcements.trackClick(request.user.id, id);
  }
}
