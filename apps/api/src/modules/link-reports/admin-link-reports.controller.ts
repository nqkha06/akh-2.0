import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser } from "../../common/http/current-user.decorator";
import type { AuthenticatedUser } from "../auth/auth.types";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import {
  QueryLinkReportsDto,
  UpdateLinkReportDto,
} from "./dto/admin-link-report.dto";
import { LinkReportsService } from "./link-reports.service";

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
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateLinkReportDto,
  ) {
    return this.reports.updateForAdmin(id, user.id, dto);
  }

  @Delete(":id")
  @Permissions("link-reports.delete")
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.reports.deleteForAdmin(id, user.id);
  }
}
