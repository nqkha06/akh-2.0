import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { validateWorkerEnvironment } from "./config/env.validation";
import { PrismaModule } from "./database/prisma/prisma.module";
import { VisitAggregationWorkerModule } from "./modules/system-jobs/visit-aggregation-worker.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateWorkerEnvironment,
    }),
    PrismaModule,
    VisitAggregationWorkerModule,
  ],
})
export class WorkerAppModule {}
