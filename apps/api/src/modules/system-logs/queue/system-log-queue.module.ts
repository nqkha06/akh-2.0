import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { QueueInfrastructureModule } from "../../../infrastructure/queue/queue-infrastructure.module";
import { SYSTEM_LOG_QUEUE } from "../system-log.constants";

@Module({
  imports: [
    QueueInfrastructureModule,
    BullModule.registerQueue({ name: SYSTEM_LOG_QUEUE }),
  ],
  exports: [BullModule],
})
export class SystemLogQueueModule {}
