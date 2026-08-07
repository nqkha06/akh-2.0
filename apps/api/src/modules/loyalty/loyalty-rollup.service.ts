import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";
import { BusinessSettingsService } from "../business-settings/business-settings.service";

const DAY_MS = 86_400_000;

type PublishedTier = {
  id: number;
  minimumValidViews: number;
  sortOrder: number;
};

export type LoyaltyRollupResult = {
  skipped: boolean;
  dayKey: string;
  processedUsers: number;
  promotedUsers: number;
  totalValidViews: number;
  windowStartedAt: Date;
  windowEndedAt: Date;
};

@Injectable()
export class LoyaltyRollupService {
  private readonly logger = new Logger(LoyaltyRollupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly businessSettings: BusinessSettingsService,
  ) {}

  async run(now = new Date()): Promise<LoyaltyRollupResult> {
    const settings = await this.businessSettings.getRuntime();
    const windowEndedAt = this.startOfUtcDay(now);
    const windowStartedAt = new Date(
      windowEndedAt.getTime() - settings.loyaltyWindowDays * DAY_MS,
    );
    const dayKey = windowEndedAt.toISOString().slice(0, 10);

    try {
      const result = await this.prisma.$transaction(
        async (prisma) => {
          const run = await prisma.loyaltyRollupRun.create({
            data: { dayKey, windowStartedAt, windowEndedAt },
          });
          const [tiers, validViewGroups, users] = await Promise.all([
            prisma.loyaltyTier.findMany({
              where: { status: "published" },
              orderBy: [
                { minimumValidViews: "asc" },
                { sortOrder: "asc" },
              ],
              select: {
                id: true,
                minimumValidViews: true,
                sortOrder: true,
              },
            }),
            prisma.linkAccessLog.groupBy({
              by: ["userId"],
              where: {
                isEarn: true,
                completedAt: {
                  gte: windowStartedAt,
                  lt: windowEndedAt,
                },
              },
              _count: { _all: true },
            }),
            prisma.user.findMany({
              select: { id: true, loyaltyTierId: true },
            }),
          ]);

          const tierById = new Map(tiers.map((tier) => [tier.id, tier]));
          const previousTierByUserId = new Map(
            users.map((user) => [user.id, user.loyaltyTierId]),
          );
          const baselineTier = this.resolveTier(tiers, 0);
          const calculatedAt = now;

          await prisma.user.updateMany({
            data: {
              loyaltyTierId: baselineTier?.id ?? null,
              loyaltyValidViews: 0,
              loyaltyWindowStartedAt: windowStartedAt,
              loyaltyWindowEndedAt: windowEndedAt,
              loyaltyCalculatedAt: calculatedAt,
            },
          });

          let promotedUsers = users.reduce((count, user) => {
            return count + (this.isPromotion(
              tierById.get(user.loyaltyTierId ?? -1),
              baselineTier,
            ) ? 1 : 0);
          }, 0);
          let totalValidViews = 0;

          for (const group of validViewGroups) {
            const validViews = group._count._all;
            const tier = this.resolveTier(tiers, validViews);
            const previousTier = tierById.get(
              previousTierByUserId.get(group.userId) ?? -1,
            );

            if (
              this.isPromotion(previousTier, tier) &&
              !this.isPromotion(previousTier, baselineTier)
            ) {
              promotedUsers += 1;
            }
            totalValidViews += validViews;

            await prisma.user.update({
              where: { id: group.userId },
              data: {
                loyaltyTierId: tier?.id ?? null,
                loyaltyValidViews: validViews,
                loyaltyWindowStartedAt: windowStartedAt,
                loyaltyWindowEndedAt: windowEndedAt,
                loyaltyCalculatedAt: calculatedAt,
              },
            });
          }

          await prisma.loyaltyRollupRun.update({
            where: { id: run.id },
            data: {
              status: "completed",
              processedUsers: users.length,
              promotedUsers,
              totalValidViews,
              completedAt: calculatedAt,
            },
          });

          return {
            skipped: false,
            dayKey,
            processedUsers: users.length,
            promotedUsers,
            totalValidViews,
            windowStartedAt,
            windowEndedAt,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 10_000,
          timeout: 120_000,
        },
      );

      this.logger.log(
        `Loyalty rollup ${dayKey} ranked ${result.processedUsers} users from ${result.totalValidViews} valid views (${result.promotedUsers} promoted).`,
      );
      return result;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const previous = await this.prisma.loyaltyRollupRun.findUniqueOrThrow({
          where: { dayKey },
        });
        return {
          skipped: true,
          dayKey,
          processedUsers: previous.processedUsers,
          promotedUsers: previous.promotedUsers,
          totalValidViews: previous.totalValidViews,
          windowStartedAt: previous.windowStartedAt,
          windowEndedAt: previous.windowEndedAt,
        };
      }
      throw error;
    }
  }

  private resolveTier(tiers: PublishedTier[], validViews: number) {
    let resolved: PublishedTier | undefined;
    for (const tier of tiers) {
      if (validViews < tier.minimumValidViews) break;
      resolved = tier;
    }
    return resolved;
  }

  private isPromotion(
    previous: PublishedTier | undefined,
    next: PublishedTier | undefined,
  ) {
    if (!next) return false;
    if (!previous) return true;
    return next.minimumValidViews > previous.minimumValidViews;
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
