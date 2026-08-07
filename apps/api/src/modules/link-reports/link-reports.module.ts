import { Module } from "@nestjs/common";

import { AdminLinkReportsController } from "./admin-link-reports.controller";
import { LinkReportsController } from "./link-reports.controller";
import { LinkReportsService } from "./link-reports.service";

@Module({
  controllers: [LinkReportsController, AdminLinkReportsController],
  providers: [LinkReportsService],
})
export class LinkReportsModule {}
