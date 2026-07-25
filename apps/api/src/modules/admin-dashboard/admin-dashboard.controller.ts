import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { AdminDashboardService } from "./admin-dashboard.service";
import { AdminDashboardQueryDto } from "./dto/admin-dashboard-query.dto";

@Controller("admin/dashboard")
@UseGuards(JwtAccessGuard, PermissionsGuard)
export class AdminDashboardController {
  constructor(private readonly dashboard: AdminDashboardService) {}

  @Get()
  @Permissions("admin.access")
  overview(@Query() query: AdminDashboardQueryDto) {
    return this.dashboard.overview(query.range);
  }
}
