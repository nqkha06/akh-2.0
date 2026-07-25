import { Module } from "@nestjs/common";

import { MemberDashboardController } from "./member-dashboard.controller";
import { MemberDashboardService } from "./member-dashboard.service";

// Keep the member-facing overview independent from admin analytics.
@Module({
  controllers: [MemberDashboardController],
  providers: [MemberDashboardService],
})
export class MemberDashboardModule {}
