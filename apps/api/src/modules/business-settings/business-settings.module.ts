import { Global, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";

import { BusinessSettingsController } from "./business-settings.controller";
import { BusinessSettingsRepository } from "./business-settings.repository";
import { BusinessSettingsService } from "./business-settings.service";
import { MaintenanceGuard } from "./maintenance.guard";

@Global()
@Module({
  controllers: [BusinessSettingsController],
  providers: [
    BusinessSettingsRepository,
    BusinessSettingsService,
    { provide: APP_GUARD, useClass: MaintenanceGuard },
  ],
  exports: [BusinessSettingsService],
})
export class BusinessSettingsModule {}
