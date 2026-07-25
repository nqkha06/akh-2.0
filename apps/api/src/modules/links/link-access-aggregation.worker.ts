import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";
import type { MonetizationRateDto } from "../monetization-levels/dto/monetization-level-config.dto";

const BATCH_SIZE = 1_000;
const ONE_MINUTE_MS = 60_000;
const REJECT_DAILY_LIMIT = 1;
const REJECT_MISSING_IP = 2;

type AggregateDelta = {
  views: number;
  revenue: Prisma.Decimal;
};

@Injectable()
export class LinkAccessAggregationWorker
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(LinkAccessAggregationWorker.name);
  private startTimer?: NodeJS.Timeout;
  private intervalTimer?: NodeJS.Timeout;
  private running = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    if (process.env.VISIT_AGGREGATION_DISABLED === "true") return;

    const delay = ONE_MINUTE_MS - (Date.now() % ONE_MINUTE_MS);
    this.startTimer = setTimeout(() => {
      void this.runSafely();
      this.intervalTimer = setInterval(
        () => void this.runSafely(),
        ONE_MINUTE_MS,
      );
      this.intervalTimer.unref();
    }, delay);
    this.startTimer.unref();
  }

  onModuleDestroy() {
    if (this.startTimer) clearTimeout(this.startTimer);
    if (this.intervalTimer) clearInterval(this.intervalTimer);
  }

  async processPending(now = new Date()) {
    const minuteKey = this.minuteKey(now);

    try {
      return await this.prisma.$transaction(
        async (prisma) => {
          const run = await prisma.accessLogAggregationRun.create({
            data: { minuteKey },
          });
          const pending = await prisma.linkAccessLog.findMany({
            where: {
              completedAt: { not: null, lte: now },
              processedAt: null,
            },
            orderBy: [{ completedAt: "asc" }, { id: "asc" }],
            take: BATCH_SIZE,
          });

          const dailyLimits = await this.loadDailyLimits(prisma, pending);
          const existingEarnCounts = await this.loadExistingEarnCounts(
            prisma,
            pending,
          );
          const linkDeltas = new Map<number, AggregateDelta>();
          const userRevenueDeltas = new Map<number, Prisma.Decimal>();
          let earnedViews = 0;
          let totalRevenue = new Prisma.Decimal(0);

          for (const access of pending) {
            const completedAt = access.completedAt;
            if (!completedAt) continue;

            const day = this.startOfUtcDay(completedAt);
            const earnKey = this.earnKey(access.userId, access.ipAddress, day);
            const earnedSoFar = existingEarnCounts.get(earnKey) ?? 0;
            const dailyLimit = dailyLimits.get(access.id) ?? null;
            let rejectReasonMask = access.rejectReasonMask;
            let isEarn =
              Boolean(access.ipAddress) && access.payoutCpm.greaterThan(0);

            if (!access.ipAddress) rejectReasonMask |= REJECT_MISSING_IP;
            if (
              isEarn &&
              dailyLimit !== null &&
              earnedSoFar >= dailyLimit
            ) {
              isEarn = false;
              rejectReasonMask |= REJECT_DAILY_LIMIT;
            }

            const revenue = isEarn
              ? access.payoutCpm.div(1_000)
              : new Prisma.Decimal(0);

            await prisma.linkAccessLog.update({
              where: { id: access.id },
              data: {
                isEarn,
                revenue,
                rejectReasonMask,
                processedAt: now,
              },
            });

            this.addLinkView(linkDeltas, access.linkId);
            if (!isEarn) continue;

            existingEarnCounts.set(earnKey, earnedSoFar + 1);
            earnedViews += 1;
            totalRevenue = totalRevenue.add(revenue);
            this.addRevenue(linkDeltas, access.linkId, revenue);
            userRevenueDeltas.set(
              access.userId,
              (userRevenueDeltas.get(access.userId) ?? new Prisma.Decimal(0)).add(
                revenue,
              ),
            );
          }

          for (const [linkId, delta] of linkDeltas) {
            await prisma.link.update({
              where: { id: linkId },
              data: {
                views: { increment: delta.views },
                revenue: { increment: delta.revenue },
              },
            });
          }

          for (const [userId, revenue] of userRevenueDeltas) {
            await prisma.user.update({
              where: { id: userId },
              data: { balance: { increment: revenue } },
            });
          }

          await prisma.accessLogAggregationRun.update({
            where: { id: run.id },
            data: {
              status: "completed",
              processedCount: pending.length,
              earnedViews,
              revenue: totalRevenue,
              completedAt: now,
            },
          });

          return {
            skipped: false,
            minuteKey,
            processedCount: pending.length,
            earnedViews,
            revenue: totalRevenue.toString(),
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return {
          skipped: true,
          minuteKey,
          processedCount: 0,
          earnedViews: 0,
          revenue: "0",
        };
      }
      throw error;
    }
  }

  private async runSafely() {
    if (this.running) return;
    this.running = true;
    try {
      const result = await this.processPending();
      if (!result.skipped && result.processedCount > 0) {
        this.logger.log(
          `Aggregated ${result.processedCount} visits (${result.earnedViews} earned) for ${result.minuteKey}.`,
        );
      }
    } catch (error) {
      this.logger.error(
        "Visit aggregation failed; the transaction was rolled back.",
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.running = false;
    }
  }

  private async loadExistingEarnCounts(
    prisma: Prisma.TransactionClient,
    pending: Array<{
      userId: number;
      ipAddress: string | null;
      completedAt: Date | null;
    }>,
  ) {
    const counts = new Map<string, number>();
    const days = new Map<number, Date>();

    for (const access of pending) {
      if (!access.completedAt) continue;
      const day = this.startOfUtcDay(access.completedAt);
      days.set(day.getTime(), day);
    }

    for (const day of days.values()) {
      const nextDay = new Date(day.getTime() + 86_400_000);
      const groups = await prisma.linkAccessLog.groupBy({
        by: ["userId", "ipAddress"],
        where: {
          isEarn: true,
          processedAt: { not: null },
          completedAt: { gte: day, lt: nextDay },
        },
        _count: { _all: true },
      });

      for (const group of groups) {
        counts.set(
          this.earnKey(group.userId, group.ipAddress, day),
          group._count._all,
        );
      }
    }

    return counts;
  }

  private async loadDailyLimits(
    prisma: Prisma.TransactionClient,
    pending: Array<{
      id: string;
      levelId: number | null;
      country: string;
      device: number;
    }>,
  ) {
    const levelIds = [
      ...new Set(
        pending
          .map((access) => access.levelId)
          .filter((levelId): levelId is number => levelId !== null),
      ),
    ];
    if (levelIds.length === 0) return new Map<string, number | null>();

    const levels = await prisma.monetizationLevel.findMany({
      where: { id: { in: levelIds } },
      select: { id: true, ratesJson: true },
    });
    const ratesByLevel = new Map(
      levels.map((level) => [
        level.id,
        this.parseRates(level.ratesJson),
      ]),
    );

    return new Map(
      pending.map((access) => [
        access.id,
        access.levelId === null
          ? null
          : this.selectDailyLimit(
              ratesByLevel.get(access.levelId) ?? [],
              access.country,
              this.deviceType(access.device),
            ),
      ]),
    );
  }

  private parseRates(value: string): MonetizationRateDto[] {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as MonetizationRateDto[]) : [];
    } catch {
      return [];
    }
  }

  private selectDailyLimit(
    rates: MonetizationRateDto[],
    country: string,
    deviceType: MonetizationRateDto["deviceType"],
  ) {
    const rate = rates
      .filter(
        (candidate) =>
          candidate.enabled &&
          (candidate.countryCode === country ||
            candidate.countryCode === "ALL") &&
          (candidate.deviceType === deviceType ||
            candidate.deviceType === "any"),
      )
      .sort((left, right) => {
        const leftScore =
          (left.countryCode === country ? 2 : 0) +
          (left.deviceType === deviceType ? 1 : 0);
        const rightScore =
          (right.countryCode === country ? 2 : 0) +
          (right.deviceType === deviceType ? 1 : 0);
        return rightScore - leftScore;
      })[0];

    return rate?.dailyLimit ?? null;
  }

  private deviceType(device: number): MonetizationRateDto["deviceType"] {
    if (device === 1) return "mobile";
    if (device === 3) return "tablet";
    return "desktop";
  }

  private addLinkView(
    target: Map<number, AggregateDelta>,
    id: number,
  ) {
    const current = target.get(id) ?? {
      views: 0,
      revenue: new Prisma.Decimal(0),
    };
    current.views += 1;
    target.set(id, current);
  }

  private addRevenue(
    target: Map<number, AggregateDelta>,
    id: number,
    revenue: Prisma.Decimal,
  ) {
    const current = target.get(id) ?? {
      views: 0,
      revenue: new Prisma.Decimal(0),
    };
    current.revenue = current.revenue.add(revenue);
    target.set(id, current);
  }

  private earnKey(userId: number, ipAddress: string | null, date: Date) {
    return `${userId}|${ipAddress ?? "missing"}|${date.toISOString()}`;
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

  private minuteKey(value: Date) {
    return value.toISOString().slice(0, 16);
  }
}
