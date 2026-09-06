import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";

import { AuthModule } from "../auth/auth.module";
import { SystemLogExceptionFilter } from "./filters/system-log-exception.filter";
import { SystemLogsCoreModule } from "./system-logs-core.module";
import {
  SystemLogCategoriesController,
  SystemLogsController,
  SystemLogSettingsController,
} from "./system-logs.controller";

@Module({
  imports: [AuthModule, SystemLogsCoreModule],
  controllers: [
    SystemLogsController,
    SystemLogSettingsController,
    SystemLogCategoriesController,
  ],
  providers: [{ provide: APP_FILTER, useClass: SystemLogExceptionFilter }],
})
export class SystemLogsModule {}
