import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";

import type { AuthenticatedUser } from "../auth/auth.types";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import {
  QueryLinkReportsDto,
  UpdateLinkReportDto,
} from "./dto/admin-link-report.dto";
import { LinkReportsService } from "./link-reports.service";

type AdminRequest = Request & { user: AuthenticatedUser };

@Controller("admin/link-reports")
@UseGuards(JwtAccessGuard, PermissionsGuard)
export class AdminLinkReportsController {
  constructor(private readonly reports: LinkReportsService) {}

  @Get()
  @Permissions("link-reports.read")
  findAll(@Query() query: QueryLinkReportsDto) {
    return this.reports.findAllForAdmin(query);
  }

  @Get(":id")
  @Permissions("link-reports.read")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.reports.findOneForAdmin(id);
  }

  @Patch(":id")
  @Permissions("link-reports.manage")
  update(
    @Req() request: AdminRequest,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateLinkReportDto,
  ) {
    return this.reports.updateForAdmin(id, request.user.id, dto);
  }

  @Delete(":id")
  @Permissions("link-reports.delete")
  remove(
    @Req() request: AdminRequest,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.reports.deleteForAdmin(id, request.user.id);
  }
}
