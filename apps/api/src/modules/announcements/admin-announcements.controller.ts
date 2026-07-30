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

import type { AuthenticatedUser } from "../auth/auth.types";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { AnnouncementsService } from "./announcements.service";
import {
  CreateAnnouncementDto,
  ListAnnouncementsQueryDto,
  UpdateAnnouncementDto,
} from "./dto/announcement.dto";

type AdminRequest = Request & { user: AuthenticatedUser };

@Controller("admin/announcements")
@UseGuards(JwtAccessGuard, PermissionsGuard)
export class AdminAnnouncementsController {
  constructor(private readonly announcements: AnnouncementsService) {}

  @Get()
  @Permissions("announcements.view")
  list(@Query() query: ListAnnouncementsQueryDto) {
    return this.announcements.listForAdmin(query);
  }

  @Get(":id")
  @Permissions("announcements.view")
  find(@Param("id", ParseIntPipe) id: number) {
    return this.announcements.findForAdmin(id);
  }

  @Post()
  @Permissions("announcements.create")
  create(@Req() request: AdminRequest, @Body() dto: CreateAnnouncementDto) {
    return this.announcements.create(request.user.id, dto);
  }

  @Patch(":id")
  @Permissions("announcements.update")
  update(
    @Req() request: AdminRequest,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    return this.announcements.update(request.user.id, id, dto);
  }

  @Post(":id/publish")
  @Permissions("announcements.publish")
  publish(@Req() request: AdminRequest, @Param("id", ParseIntPipe) id: number) {
    return this.announcements.publish(request.user.id, id);
  }

  @Post(":id/pause")
  @Permissions("announcements.update")
  pause(@Req() request: AdminRequest, @Param("id", ParseIntPipe) id: number) {
    return this.announcements.pause(request.user.id, id);
  }

  @Post(":id/duplicate")
  @Permissions("announcements.create")
  duplicate(@Req() request: AdminRequest, @Param("id", ParseIntPipe) id: number) {
    return this.announcements.duplicate(request.user.id, id);
  }

  @Get(":id/analytics")
  @Permissions("announcements.view")
  analytics(@Param("id", ParseIntPipe) id: number) {
    return this.announcements.analytics(id);
  }

  @Delete(":id")
  @Permissions("announcements.delete")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.announcements.remove(id);
  }
}

