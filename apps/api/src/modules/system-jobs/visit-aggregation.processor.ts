import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@prisma/client";
import type { Job } from "bullmq";

import {
  SYSTEM_QUEUE,
  VISIT_AGGREGATION_JOB,
} from "../../infrastructure/queue/queue.constants";
import { LinkAccessAggregationWorker } from "../links/link-access-aggregation.worker";

const DEFAULT_MAX_BATCHES = 20;
const MAX_BATCHES_PER_JOB = 100;

type VisitAggregationResult = {
  batches: number;
  processedCount: number;
  earnedViews: number;
  revenue: string;
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
    private readonly config: ConfigService,
  ) {
    super();
  }

  async process(job: Job): Promise<VisitAggregationResult> {
    if (job.name !== VISIT_AGGREGATION_JOB) {
      throw new Error(`Unsupported system job: ${job.name}`);
    }
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

  @OnWorkerEvent("failed")
  onFailed(job: Job | undefined, error: Error) {
    this.logger.error(
      `Visit aggregation job ${job?.id ?? "unknown"} failed: ${error.message}`,
      error.stack,
    );
  }

  @OnWorkerEvent("stalled")
  onStalled(jobId: string) {
    this.logger.warn(`Visit aggregation job ${jobId} stalled and will retry.`);
  }

  private maxBatches() {
    const parsed = Number(
      this.config.get<string>("VISIT_AGGREGATION_MAX_BATCHES_PER_JOB"),
    );
    return Number.isInteger(parsed) && parsed >= 1 && parsed <= MAX_BATCHES_PER_JOB
      ? parsed
      : DEFAULT_MAX_BATCHES;
  }
}
