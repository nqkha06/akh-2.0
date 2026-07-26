import { Module } from "@nestjs/common";

import { SystemQueueModule } from "../../infrastructure/queue/system-queue.module";
import { VisitAggregationScheduler } from "./visit-aggregation-scheduler.service";

@Module({
  imports: [SystemQueueModule],
  providers: [VisitAggregationScheduler],
})
export class VisitAggregationSchedulerModule {}

