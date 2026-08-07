import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Queue } from "bullmq";

import {
  LOYALTY_ROLLUP_JOB,
  LOYALTY_ROLLUP_SCHEDULER,
  SYSTEM_QUEUE,
} from "../../infrastructure/queue/queue.constants";

const DEFAULT_CRON_PATTERN = "0 0 * * *";

@Injectable()
export class LoyaltyRollupScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(LoyaltyRollupScheduler.name);

  constructor(
    @InjectQueue(SYSTEM_QUEUE) private readonly queue: Queue,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    if (this.config.get<string>("LOYALTY_ROLLUP_DISABLED") === "true") {
      await this.queue.removeJobScheduler(LOYALTY_ROLLUP_SCHEDULER);
      this.logger.warn("Daily loyalty rollup scheduler is disabled.");
      return;
    }

    const pattern =
      this.config.get<string>("LOYALTY_ROLLUP_CRON")?.trim() ||
      DEFAULT_CRON_PATTERN;
    await this.queue.waitUntilReady();
    await this.queue.setGlobalConcurrency(1);
    await this.queue.upsertJobScheduler(
      LOYALTY_ROLLUP_SCHEDULER,
      { pattern, tz: "UTC" },
      {
        name: LOYALTY_ROLLUP_JOB,
        data: { version: 1 },
        opts: {
          attempts: 5,
          backoff: { type: "exponential", delay: 10_000 },
          removeOnComplete: { age: 604_800, count: 100 },
          removeOnFail: { age: 2_592_000, count: 500 },
        },
      },
    );

    this.logger.log(
      `Registered ${LOYALTY_ROLLUP_SCHEDULER} with cron "${pattern}" (UTC).`,
    );
  }
}
