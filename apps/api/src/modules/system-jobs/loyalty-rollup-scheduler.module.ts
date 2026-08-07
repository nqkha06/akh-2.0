import { Module } from "@nestjs/common";

import { SystemQueueModule } from "../../infrastructure/queue/system-queue.module";
import { LoyaltyRollupScheduler } from "./loyalty-rollup-scheduler.service";

@Module({
  imports: [SystemQueueModule],
  providers: [LoyaltyRollupScheduler],
})
export class LoyaltyRollupSchedulerModule {}
