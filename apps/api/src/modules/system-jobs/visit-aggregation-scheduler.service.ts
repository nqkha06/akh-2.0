import { InjectQueue } from "@nestjs/bullmq";
import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Queue } from "bullmq";

import {
  SYSTEM_QUEUE,
  VISIT_AGGREGATION_JOB,
  VISIT_AGGREGATION_SCHEDULER,
} from "../../infrastructure/queue/queue.constants";

const DEFAULT_INTERVAL_MS = 60_000;
const MINIMUM_INTERVAL_MS = 10_000;

@Injectable()
export class VisitAggregationScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(VisitAggregationScheduler.name);

  constructor(
    @InjectQueue(SYSTEM_QUEUE) private readonly queue: Queue,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    if (this.config.get<string>("VISIT_AGGREGATION_DISABLED") === "true") {
      await this.queue.removeJobScheduler(VISIT_AGGREGATION_SCHEDULER);
      this.logger.warn("Visit aggregation scheduler is disabled.");
      return;
    }

    const interval = this.intervalMs();
    await this.queue.waitUntilReady();
    await this.queue.setGlobalConcurrency(1);
    await this.queue.upsertJobScheduler(
      VISIT_AGGREGATION_SCHEDULER,
      { every: interval },
      {
        name: VISIT_AGGREGATION_JOB,
        data: { version: 1 },
        opts: {
          attempts: 5,
          backoff: { type: "exponential", delay: 5_000 },
          removeOnComplete: { age: 86_400, count: 1_000 },
          removeOnFail: { age: 604_800, count: 5_000 },
        },
      },
    );

    this.logger.log(
      `Registered ${VISIT_AGGREGATION_SCHEDULER} every ${interval}ms with global concurrency 1.`,
    );
  }

  private intervalMs() {
    const parsed = Number(
      this.config.get<string>("VISIT_AGGREGATION_INTERVAL_MS"),
    );
    return Number.isInteger(parsed) && parsed >= MINIMUM_INTERVAL_MS
      ? parsed
      : DEFAULT_INTERVAL_MS;
  }
}

