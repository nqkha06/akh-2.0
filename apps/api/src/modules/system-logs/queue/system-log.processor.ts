import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job } from "bullmq";

import { SystemLogService } from "../system-log.service";
import { SystemLogSettingsService } from "../system-log-settings.service";
import {
  SYSTEM_LOG_CLEANUP_JOB,
  SYSTEM_LOG_PERSIST_JOB,
  SYSTEM_LOG_QUEUE,
} from "../system-log.constants";
import type { NormalizedSystemLogInput } from "../system-log.types";

@Processor(SYSTEM_LOG_QUEUE, { concurrency: 10 })
export class SystemLogProcessor extends WorkerHost {
  private readonly logger = new Logger(SystemLogProcessor.name);

  constructor(
    private readonly logs: SystemLogService,
    private readonly settings: SystemLogSettingsService,
  ) {
    super();
  }

  process(job: Job) {
    if (job.name === SYSTEM_LOG_PERSIST_JOB) {
      return this.logs.persistQueued(job.data as NormalizedSystemLogInput & { createdAt?: string });
    }
    if (job.name === SYSTEM_LOG_CLEANUP_JOB) {
      return this.settings.cleanupExpired();
    }
    throw new Error(`Unsupported system-log job: ${job.name}`);
  }

  @OnWorkerEvent("failed")
  onFailed(job: Job | undefined, error: Error) {
    this.logger.error(`System-log job ${job?.id ?? "unknown"} failed: ${error.message}`, error.stack);
  }
}
