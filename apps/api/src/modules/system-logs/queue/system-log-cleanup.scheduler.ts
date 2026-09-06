import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Queue } from "bullmq";

import {
  SYSTEM_LOG_CLEANUP_JOB,
  SYSTEM_LOG_CLEANUP_SCHEDULER,
  SYSTEM_LOG_QUEUE,
} from "../system-log.constants";

const DEFAULT_INTERVAL_MS = 24 * 60 * 60 * 1_000;
const MINIMUM_INTERVAL_MS = 60_000;

@Injectable()
export class SystemLogCleanupScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(SystemLogCleanupScheduler.name);

  constructor(
    @InjectQueue(SYSTEM_LOG_QUEUE) private readonly queue: Queue,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    if (this.config.get<string>("SYSTEM_LOG_CLEANUP_DISABLED") === "true") {
      await this.queue.removeJobScheduler(SYSTEM_LOG_CLEANUP_SCHEDULER);
      return;
    }
    const configured = Number(this.config.get<string>("SYSTEM_LOG_CLEANUP_INTERVAL_MS"));
    const every = Number.isInteger(configured) && configured >= MINIMUM_INTERVAL_MS
      ? configured
      : DEFAULT_INTERVAL_MS;
    await this.queue.waitUntilReady();
    await this.queue.upsertJobScheduler(
      SYSTEM_LOG_CLEANUP_SCHEDULER,
      { every },
      { name: SYSTEM_LOG_CLEANUP_JOB, data: { version: 1 } },
    );
    this.logger.log(`Registered system log cleanup every ${every}ms.`);
  }
}
