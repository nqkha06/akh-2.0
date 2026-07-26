import { Module } from "@nestjs/common";

import { SystemQueueModule } from "../../infrastructure/queue/system-queue.module";
import { LinkAccessAggregationModule } from "../links/link-access-aggregation.module";
import { VisitAggregationProcessor } from "./visit-aggregation.processor";

@Module({
  imports: [SystemQueueModule, LinkAccessAggregationModule],
  providers: [VisitAggregationProcessor],
})
export class VisitAggregationWorkerModule {}
