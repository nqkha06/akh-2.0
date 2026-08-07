import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@prisma/client";
import type { Job } from "bullmq";

import {
  LOYALTY_ROLLUP_JOB,
  SYSTEM_QUEUE,
  VISIT_AGGREGATION_JOB,
} from "../../infrastructure/queue/queue.constants";
import { LinkAccessAggregationWorker } from "../links/link-access-aggregation.worker";
import { LoyaltyRollupService } from "../loyalty/loyalty-rollup.service";

const DEFAULT_MAX_BATCHES = 20;
const MAX_BATCHES_PER_JOB = 100;

type VisitAggregationResult = {
  batches: number;
  processedCount: number;
  earnedViews: number;
  revenue: string;
};

type LoyaltyJobResult = {
  skipped: boolean;
  dayKey: string;
  preflightProcessedCount: number;
  processedUsers: number;
  promotedUsers: number;
  totalValidViews: number;
  windowStartedAt: string;
  windowEndedAt: string;
};

@Processor(SYSTEM_QUEUE, {
  concurrency: 1,
  lockDuration: 300_000,
  maxStalledCount: 2,
  stalledInterval: 30_000,
})
export class VisitAggregationProcessor extends WorkerHost {
  private readonly logger = new Logger(VisitAggregationProcessor.name);

  constructor(
    private readonly aggregation: LinkAccessAggregationWorker,
    private readonly loyaltyRollup: LoyaltyRollupService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  async process(job: Job): Promise<VisitAggregationResult | LoyaltyJobResult> {
    if (job.name === VISIT_AGGREGATION_JOB) {
      return this.processVisitAggregation(job);
    }
    if (job.name === LOYALTY_ROLLUP_JOB) {
      return this.processLoyaltyRollup(job);
    }
    throw new Error(`Unsupported system job: ${job.name}`);
  }

  private async processVisitAggregation(job: Job): Promise<VisitAggregationResult> {
    if (this.config.get<string>("VISIT_AGGREGATION_DISABLED") === "true") {
      this.logger.warn(`Skipped disabled visit aggregation job ${job.id}.`);
      return {
        batches: 0,
        processedCount: 0,
        earnedViews: 0,
        revenue: "0",
      };
    }

    const cutoff = new Date();
    const jobKey = String(job.id ?? `${job.name}-${job.timestamp}`);
    const maxBatches = this.maxBatches();
    let processedCount = 0;
    let earnedViews = 0;
    let revenue = new Prisma.Decimal(0);
    let completedBatches = 0;

    for (let batch = 0; batch < maxBatches; batch += 1) {
      const result = await this.aggregation.processPending(
        cutoff,
        `${jobKey}:batch:${batch}`,
      );
      completedBatches += 1;

      if (!result.skipped) {
        processedCount += result.processedCount;
        earnedViews += result.earnedViews;
        revenue = revenue.add(result.revenue);
      }

      await job.updateProgress({
        batches: completedBatches,
        processedCount,
        earnedViews,
      });

      if (!result.skipped && result.processedCount < result.batchSize) break;
    }

    const output = {
      batches: completedBatches,
      processedCount,
      earnedViews,
      revenue: revenue.toString(),
    };
    this.logger.log(
      `Job ${jobKey} aggregated ${processedCount} visits across ${completedBatches} batches (${earnedViews} earned).`,
    );
    return output;
  }

  private async processLoyaltyRollup(job: Job): Promise<LoyaltyJobResult> {
    if (this.config.get<string>("LOYALTY_ROLLUP_DISABLED") === "true") {
      this.logger.warn(`Skipped disabled loyalty rollup job ${job.id}.`);
      const runAt = this.startOfUtcDay(new Date(job.timestamp));
      return {
        skipped: true,
        dayKey: runAt.toISOString().slice(0, 10),
        preflightProcessedCount: 0,
        processedUsers: 0,
        promotedUsers: 0,
        totalValidViews: 0,
        windowStartedAt: runAt.toISOString(),
        windowEndedAt: runAt.toISOString(),
      };
    }

    const runAt = this.startOfUtcDay(new Date(job.timestamp));
    const jobKey = String(job.id ?? `${job.name}-${job.timestamp}`);
    let preflightProcessedCount = 0;

    for (let batch = 0; batch < this.maxBatches(); batch += 1) {
      const result = await this.aggregation.processPending(
        runAt,
        `${jobKey}:preflight:${batch}`,
      );
      if (!result.skipped) {
        preflightProcessedCount += result.processedCount;
      }
      if (!result.skipped && result.processedCount < result.batchSize) break;
    }

    await job.updateProgress({
      phase: "ranking",
      preflightProcessedCount,
    });
    const result = await this.loyaltyRollup.run(runAt);
    const output = {
      skipped: result.skipped,
      dayKey: result.dayKey,
      preflightProcessedCount,
      processedUsers: result.processedUsers,
      promotedUsers: result.promotedUsers,
      totalValidViews: result.totalValidViews,
      windowStartedAt: result.windowStartedAt.toISOString(),
      windowEndedAt: result.windowEndedAt.toISOString(),
    };
    this.logger.log(
      `Job ${jobKey} completed loyalty rollup ${result.dayKey} for ${result.processedUsers} users.`,
    );
    return output;
  }

  @OnWorkerEvent("failed")
  onFailed(job: Job | undefined, error: Error) {
    this.logger.error(
      `System job ${job?.id ?? "unknown"} (${job?.name ?? "unknown"}) failed: ${error.message}`,
      error.stack,
    );
  }

  @OnWorkerEvent("stalled")
  onStalled(jobId: string) {
    this.logger.warn(`System job ${jobId} stalled and will retry.`);
  }

  private maxBatches() {
    const parsed = Number(
      this.config.get<string>("VISIT_AGGREGATION_MAX_BATCHES_PER_JOB"),
    );
    return Number.isInteger(parsed) && parsed >= 1 && parsed <= MAX_BATCHES_PER_JOB
      ? parsed
      : DEFAULT_MAX_BATCHES;
  }

  private startOfUtcDay(value: Date) {
    return new Date(
      Date.UTC(
        value.getUTCFullYear(),
        value.getUTCMonth(),
        value.getUTCDate(),
      ),
    );
  }
}
