import { Global, Module } from "@nestjs/common";

import { RequestContextModule } from "../../common/request-context/request-context.module";
import { PrismaModule } from "../../database/prisma/prisma.module";
import { AdminSystemLogsService } from "./admin-system-logs.service";
import { SystemLogQueueModule } from "./queue/system-log-queue.module";
import { SystemLogRepository } from "./system-log.repository";
import { SystemLogService } from "./system-log.service";
import { SystemLogSettingsService } from "./system-log-settings.service";

const queueImports = process.env.QUEUE_ENABLED === "false" ? [] : [SystemLogQueueModule];

@Global()
@Module({
  imports: [PrismaModule, RequestContextModule, ...queueImports],
  providers: [
    SystemLogRepository,
    SystemLogService,
    SystemLogSettingsService,
    AdminSystemLogsService,
  ],
  exports: [SystemLogService, SystemLogSettingsService, AdminSystemLogsService],
})
export class SystemLogsCoreModule {}
