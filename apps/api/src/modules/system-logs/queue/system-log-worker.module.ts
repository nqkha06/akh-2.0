import { Module } from "@nestjs/common";

import { RequestContextModule } from "../../../common/request-context/request-context.module";
import { SystemLogsCoreModule } from "../system-logs-core.module";
import { SystemLogQueueModule } from "./system-log-queue.module";
import { SystemLogProcessor } from "./system-log.processor";

@Module({
  imports: [RequestContextModule, SystemLogQueueModule, SystemLogsCoreModule],
  providers: [SystemLogProcessor],
})
export class SystemLogWorkerModule {}
