import { Module } from "@nestjs/common";

import { SystemLogsCoreModule } from "../system-logs-core.module";
import { SystemLogQueueModule } from "./system-log-queue.module";
import { SystemLogCleanupScheduler } from "./system-log-cleanup.scheduler";

@Module({
  imports: [SystemLogQueueModule, SystemLogsCoreModule],
  providers: [SystemLogCleanupScheduler],
})
export class SystemLogCleanupSchedulerModule {}
