import { Module } from "@nestjs/common";

import { LinkAccessAggregationWorker } from "./link-access-aggregation.worker";

@Module({
  providers: [LinkAccessAggregationWorker],
  exports: [LinkAccessAggregationWorker],
})
export class LinkAccessAggregationModule {}

