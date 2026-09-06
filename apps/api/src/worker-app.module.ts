import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { validateWorkerEnvironment } from "./config/env.validation";
import { PrismaModule } from "./database/prisma/prisma.module";
import { VisitAggregationWorkerModule } from "./modules/system-jobs/visit-aggregation-worker.module";
import { RequestContextModule } from "./common/request-context/request-context.module";
import { SystemLogWorkerModule } from "./modules/system-logs/queue/system-log-worker.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateWorkerEnvironment,
    }),
    PrismaModule,
    RequestContextModule,
    VisitAggregationWorkerModule,
    SystemLogWorkerModule,
  ],
})
export class WorkerAppModule {}
