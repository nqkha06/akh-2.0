import { Module } from "@nestjs/common";

import { SnippetsModule } from "../snippets/snippets.module";
import { AdminLinksController } from "./admin-links.controller";
import { AdminLinksService } from "./admin-links.service";
import { LinksController } from "./links.controller";
import { LinksService } from "./links.service";
import { LinkAccessAggregationModule } from "./link-access-aggregation.module";
import { LinkVisitAnalyticsService } from "./link-visit-analytics.service";

@Module({
  imports: [SnippetsModule, LinkAccessAggregationModule],
  controllers: [LinksController, AdminLinksController],
  providers: [
    LinksService,
    AdminLinksService,
    LinkVisitAnalyticsService,
  ],
  exports: [LinkAccessAggregationModule],
})
export class LinksModule {}
