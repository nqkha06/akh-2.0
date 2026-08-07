import { Module } from "@nestjs/common";

import { SystemQueueModule } from "../../infrastructure/queue/system-queue.module";
import { LinkAccessAggregationModule } from "../links/link-access-aggregation.module";
import { LoyaltyRollupModule } from "../loyalty/loyalty-rollup.module";
import { VisitAggregationProcessor } from "./visit-aggregation.processor";

@Module({
  imports: [SystemQueueModule, LinkAccessAggregationModule, LoyaltyRollupModule],
  providers: [VisitAggregationProcessor],
})
export class VisitAggregationWorkerModule {}
