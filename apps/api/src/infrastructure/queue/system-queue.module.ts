import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { SYSTEM_QUEUE } from "./queue.constants";
import { QueueInfrastructureModule } from "./queue-infrastructure.module";

@Module({
  imports: [
    QueueInfrastructureModule,
    BullModule.registerQueue({ name: SYSTEM_QUEUE }),
  ],
  exports: [BullModule],
})
export class SystemQueueModule {}

