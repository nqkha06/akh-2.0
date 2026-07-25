import { Module } from "@nestjs/common";

import { SnippetsModule } from "../snippets/snippets.module";
import { AdminLinksController } from "./admin-links.controller";
import { AdminLinksService } from "./admin-links.service";
import { LinksController } from "./links.controller";
import { LinksService } from "./links.service";
import { LinkAccessAggregationWorker } from "./link-access-aggregation.worker";
import { LinkVisitAnalyticsService } from "./link-visit-analytics.service";

@Module({
  imports: [SnippetsModule],
  controllers: [LinksController, AdminLinksController],
  providers: [
    LinksService,
    AdminLinksService,
    LinkVisitAnalyticsService,
    LinkAccessAggregationWorker,
  ],
  exports: [LinkAccessAggregationWorker],
})
export class LinksModule {}
