import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Queue } from "bullmq";

import { RequestContextService } from "../../common/request-context/request-context.service";
import {
  SYSTEM_LOG_PERSIST_JOB,
  SYSTEM_LOG_QUEUE,
  type SystemLogLevel,
} from "./system-log.constants";
import { SystemLogRepository } from "./system-log.repository";
import {
  sanitizeSystemLogMetadata,
  sanitizeSystemLogText,
} from "./system-log-sanitizer";
import type {
  NormalizedSystemLogInput,
  SystemLogInput,
  SystemLogWriteInput,
} from "./system-log.types";

@Injectable()
export class SystemLogService {
  private readonly logger = new Logger(SystemLogService.name);

  constructor(
    private readonly repository: SystemLogRepository,
    private readonly requestContext: RequestContextService,
    private readonly config: ConfigService,
    @Optional()
    @InjectQueue(SYSTEM_LOG_QUEUE)
    private readonly queue?: Queue,
  ) {}

  info(input: SystemLogWriteInput) {
    return this.log({ ...input, level: "info" });
  }

  warn(input: SystemLogWriteInput) {
    return this.log({ ...input, level: "warn" });
  }

  error(input: SystemLogWriteInput) {
    return this.log({ ...input, level: "error", critical: true });
  }

  debug(input: SystemLogWriteInput) {
    return this.log({ ...input, level: "debug" });
  }

  async log(input: SystemLogInput) {
    const normalized = this.normalize(input);
    const important =
      input.critical ||
      normalized.level === "error" ||
      normalized.category === "SECURITY" ||
      normalized.category === "BUSINESS";

    if (!important && this.queueEnabled() && this.queue) {
      try {
        const queued = {
          ...normalized,
          createdAt: normalized.createdAt?.toISOString(),
        };
        await this.queue.add(SYSTEM_LOG_PERSIST_JOB, queued, {
          attempts: 5,
          backoff: { type: "exponential", delay: 2_000 },
          removeOnComplete: { age: 3_600, count: 5_000 },
          removeOnFail: { age: 604_800, count: 10_000 },
        });
        return { queued: true as const };
      } catch (error) {
        this.logger.warn(
          `Không thể enqueue system log; chuyển sang persist trực tiếp: ${errorMessage(error)}`,
        );
      }
    }

    return this.persistWithoutThrowing(normalized);
  }

  persistQueued(input: NormalizedSystemLogInput & { createdAt?: string | Date }) {
    return this.repository.create({
      ...input,
      createdAt: input.createdAt ? new Date(input.createdAt) : undefined,
    });
  }

  private async persistWithoutThrowing(input: NormalizedSystemLogInput) {
    try {
      const result = await this.repository.create(input);
      return { queued: false as const, persisted: true as const, id: result.id };
    } catch (error) {
      this.logger.error(
        `Không thể persist system log ${input.category}/${input.event ?? "unknown"}: ${errorMessage(error)}`,
      );
      return { queued: false as const, persisted: false as const };
    }
  }

  private normalize(input: SystemLogInput): NormalizedSystemLogInput {
    const context = this.requestContext.get();
    return {
      level: normalizeLevel(input.level),
      category: normalizeCategory(input.category),
      context: cleanOptional(input.context, 120),
      event: cleanOptional(input.event, 120),
      message: sanitizeSystemLogText(input.message, 4_000),
      metadata: sanitizeSystemLogMetadata(input.metadata),
      userId: positiveId(input.userId),
      adminId: positiveId(input.adminId),
      requestId: cleanOptional(input.requestId ?? context?.requestId, 128),
      ipAddress: cleanOptional(input.ipAddress ?? context?.ipAddress, 128),
      userAgent: cleanOptional(input.userAgent ?? context?.userAgent, 1_000),
      stack: cleanOptional(sanitizeSystemLogText(input.stack ?? "", 40_000), 40_000),
      createdAt: input.createdAt,
    };
  }

  private queueEnabled() {
    return this.config.get<string>("QUEUE_ENABLED") !== "false";
  }
}

function normalizeLevel(value: SystemLogLevel): SystemLogLevel {
  return ["info", "warn", "error", "debug"].includes(value) ? value : "info";
}

function normalizeCategory(value: string) {
  const category = value.trim().toUpperCase();
  return /^[A-Z][A-Z0-9_-]{1,39}$/.test(category) ? category : "SYSTEM";
}

function cleanOptional(value: string | null | undefined, maxLength: number) {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

function positiveId(value: number | null | undefined) {
  return Number.isSafeInteger(value) && Number(value) > 0 ? Number(value) : null;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
