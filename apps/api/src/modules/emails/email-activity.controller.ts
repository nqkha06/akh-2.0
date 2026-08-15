import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";

import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtAccessGuard } from "../auth/guards/jwt-access.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import {
  EmailActivityDetailQueryDto,
  EmailOverviewQueryDto,
  ListEmailActivityQueryDto,
} from "./dto/email-activity.dto";
import { EmailActivityService } from "./email-activity.service";

@Controller("admin/emails")
@UseGuards(JwtAccessGuard, PermissionsGuard)
export class EmailActivityController {
  constructor(private readonly activity: EmailActivityService) {}

  @Get("overview")
  @Permissions("emails.read")
  overview(@Query() query: EmailOverviewQueryDto) {
    return this.activity.overview(query);
  }

  @Get("activity")
  @Permissions("emails.logs.read")
  list(@Query() query: ListEmailActivityQueryDto) {
    return this.activity.list(query);
  }

  @Get("activity/:id")
  @Permissions("emails.logs.read")
  find(
    @Param("id") id: string,
    @Query() query: EmailActivityDetailQueryDto,
  ) {
    return this.activity.find(id, query.includeRaw || false);
  }
}
