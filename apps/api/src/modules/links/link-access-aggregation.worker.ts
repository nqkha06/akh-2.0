import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@prisma/client";
import { DEVICE_TYPE_NAMES } from "@stu/contracts";

import { PrismaService } from "../../database/prisma/prisma.service";
import type { MonetizationRateDto } from "../monetization-levels/dto/monetization-level-config.dto";

const DEFAULT_BATCH_SIZE = 1_000;
const MAX_BATCH_SIZE = 10_000;
const EARN_COUNT_QUERY_CHUNK_SIZE = 200;
const ACCESS_UPDATE_CHUNK_SIZE = 500;
const REJECT_DAILY_LIMIT = 1;
const REJECT_MISSING_IP = 2;

type AggregateDelta = {
  views: number;
  revenue: Prisma.Decimal;
};

@Injectable()
export class LinkAccessAggregationWorker {
  readonly batchSize: number;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.batchSize = this.integerSetting(
      config.get<string>("VISIT_AGGREGATION_BATCH_SIZE"),
      DEFAULT_BATCH_SIZE,
      100,
      MAX_BATCH_SIZE,
    );
  }

  async processPending(now = new Date(), runKey = this.minuteKey(now)) {

    try {
      return await this.prisma.$transaction(
        async (prisma) => {
          const run = await prisma.accessLogAggregationRun.create({
            data: { minuteKey: runKey },
          });
          const pending = await prisma.linkAccessLog.findMany({
            where: {
              completedAt: { not: null, lte: now },
              processedAt: null,
            },
            orderBy: [{ completedAt: "asc" }, { id: "asc" }],
            take: this.batchSize,
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
          const accessUpdates = new Map<
            string,
            {
              ids: string[];
              isEarn: boolean;
              revenue: Prisma.Decimal;
              rejectReasonMask: number;
            }
          >();

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

            const updateKey = [
              isEarn ? "1" : "0",
              revenue.toString(),
              rejectReasonMask,
            ].join("|");
            const update = accessUpdates.get(updateKey) ?? {
              ids: [],
              isEarn,
              revenue,
              rejectReasonMask,
            };
            update.ids.push(access.id);
            accessUpdates.set(updateKey, update);

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

          for (const update of accessUpdates.values()) {
            for (
              let offset = 0;
              offset < update.ids.length;
              offset += ACCESS_UPDATE_CHUNK_SIZE
            ) {
              const result = await prisma.linkAccessLog.updateMany({
                where: {
                  id: {
                    in: update.ids.slice(
                      offset,
                      offset + ACCESS_UPDATE_CHUNK_SIZE,
                    ),
                  },
                  processedAt: null,
                },
                data: {
                  isEarn: update.isEarn,
                  revenue: update.revenue,
                  rejectReasonMask: update.rejectReasonMask,
                  processedAt: now,
                },
              });
              const expected = Math.min(
                ACCESS_UPDATE_CHUNK_SIZE,
                update.ids.length - offset,
              );
              if (result.count !== expected) {
                throw new Error(
                  "Visit aggregation lost its processing lease; retrying the batch is required.",
                );
              }
            }
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
            minuteKey: runKey,
            batchSize: this.batchSize,
            processedCount: pending.length,
            earnedViews,
            revenue: totalRevenue.toString(),
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 10_000,
          timeout: 60_000,
        },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return {
          skipped: true,
          minuteKey: runKey,
          batchSize: this.batchSize,
          processedCount: 0,
          earnedViews: 0,
          revenue: "0",
        };
      }
      throw error;
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
    const pairsByDay = new Map<
      number,
      Map<string, { userId: number; ipAddress: string }>
    >();

    for (const access of pending) {
      if (!access.completedAt || !access.ipAddress) continue;
      const day = this.startOfUtcDay(access.completedAt);
      const pairs = pairsByDay.get(day.getTime()) ?? new Map();
      pairs.set(`${access.userId}|${access.ipAddress}`, {
        userId: access.userId,
        ipAddress: access.ipAddress,
      });
      pairsByDay.set(day.getTime(), pairs);
    }

    for (const [dayTime, pairMap] of pairsByDay) {
      const day = new Date(dayTime);
      const nextDay = new Date(day.getTime() + 86_400_000);
      const pairs = [...pairMap.values()];

      for (
        let offset = 0;
        offset < pairs.length;
        offset += EARN_COUNT_QUERY_CHUNK_SIZE
      ) {
        const groups = await prisma.linkAccessLog.groupBy({
          by: ["userId", "ipAddress"],
          where: {
            isEarn: true,
            processedAt: { not: null },
            completedAt: { gte: day, lt: nextDay },
            OR: pairs
              .slice(offset, offset + EARN_COUNT_QUERY_CHUNK_SIZE)
              .map((pair) => ({
                userId: pair.userId,
                ipAddress: pair.ipAddress,
              })),
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
    const resolved = DEVICE_TYPE_NAMES[device];
    return resolved === "unknown" || !resolved ? "desktop" : resolved;
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

  private integerSetting(
    value: string | undefined,
    fallback: number,
    minimum: number,
    maximum: number,
  ) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum
      ? parsed
      : fallback;
  }
}
