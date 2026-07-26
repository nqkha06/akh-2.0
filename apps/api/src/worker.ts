import "reflect-metadata";

import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { WorkerAppModule } from "./worker-app.module";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerAppModule);
  app.enableShutdownHooks();

  const logger = new Logger("SystemJobsWorker");
  logger.log("System jobs worker is ready.");
}

void bootstrap();
