import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { DEVICE_TYPE_NAMES } from "@stu/contracts";

import { PrismaService } from "../../database/prisma/prisma.service";
import type { MemberDashboardRange } from "./dto/member-dashboard-query.dto";

type PeriodVisit = {
  completedAt: Date | null;
  isEarn: boolean;
  revenue: Prisma.Decimal;
  linkId: number;
};

const rangeDays: Record<
  Exclude<MemberDashboardRange, "today" | "yesterday">,
  number
> = {
  "7d": 7,
  "30d": 30,
  "60d": 60,
  "90d": 90,
};

@Injectable()
export class MemberDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(userId: number, range: MemberDashboardRange = "30d") {
    const now = new Date();
    const { periodDays, periodEnd, periodStart } = this.resolvePeriod(
      range,
      now,
    );
    const comparisonEnd = new Date(periodStart.getTime() - 1);
    const comparisonStart = new Date(
      comparisonEnd.getTime() - (periodEnd.getTime() - periodStart.getTime()),
    );
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);

    const periodVisitWhere: Prisma.LinkAccessLogWhereInput = {
      link: { userId, deletedAt: null },
      completedAt: { not: null, gte: periodStart, lte: periodEnd },
    };
    const comparisonVisitWhere: Prisma.LinkAccessLogWhereInput = {
      link: { userId, deletedAt: null },
      completedAt: {
        not: null,
        gte: comparisonStart,
        lte: comparisonEnd,
      },
    };

    const [
      user,
      periodVisits,
      comparisonVisits,
      countryGroups,
      deviceGroups,
      browserGroups,
    ] = await this.prisma.$transaction([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, balance: true },
        }),
        this.prisma.linkAccessLog.findMany({
          where: periodVisitWhere,
          select: {
            completedAt: true,
            isEarn: true,
            revenue: true,
            linkId: true,
          },
        }),
        this.prisma.linkAccessLog.findMany({
          where: comparisonVisitWhere,
          select: {
            completedAt: true,
            isEarn: true,
            revenue: true,
            linkId: true,
          },
        }),
        this.prisma.linkAccessLog.groupBy({
          by: ["country"],
          where: periodVisitWhere,
          _count: { _all: true },
          orderBy: { _count: { country: "desc" } },
          take: 5,
        }),
        this.prisma.linkAccessLog.groupBy({
          by: ["device"],
          where: periodVisitWhere,
          _count: { _all: true },
          orderBy: { _count: { device: "desc" } },
        }),
        this.prisma.linkAccessLog.groupBy({
          by: ["agentHash"],
          where: periodVisitWhere,
          _count: { _all: true },
        }),
      ]);

    if (!user) throw new NotFoundException("Không tìm thấy người dùng.");

    const periodIncludesToday = periodEnd >= todayStart;
    const todayVisits = periodIncludesToday
      ? periodVisits.filter(
          (visit) => visit.completedAt && visit.completedAt >= todayStart,
        )
      : await this.prisma.linkAccessLog.findMany({
          where: {
            link: { userId, deletedAt: null },
            completedAt: { not: null, gte: todayStart, lte: now },
          },
          select: {
            completedAt: true,
            isEarn: true,
            revenue: true,
            linkId: true,
          },
        });

    const browserCounts = await this.browserCounts(browserGroups);
    const topLinkCounts = new Map<
      number,
      { successfulOpens: number; revenue: Prisma.Decimal }
    >();

    for (const visit of periodVisits) {
      const current = topLinkCounts.get(visit.linkId) ?? {
        successfulOpens: 0,
        revenue: new Prisma.Decimal(0),
      };
      current.successfulOpens += 1;
      current.revenue = current.revenue.add(visit.revenue);
      topLinkCounts.set(visit.linkId, current);
    }

    const topLinkIds = [...topLinkCounts.entries()]
      .sort(
        ([, left], [, right]) =>
          right.successfulOpens - left.successfulOpens,
      )
      .slice(0, 5)
      .map(([linkId]) => linkId);
    const topLinkRecords = topLinkIds.length
      ? await this.prisma.link.findMany({
          where: { id: { in: topLinkIds }, userId, deletedAt: null },
          select: { id: true, slug: true, title: true },
        })
      : [];
    const topLinkById = new Map(
      topLinkRecords.map((link) => [link.id, link]),
    );
    const series = this.buildSeries(periodStart, periodDays, periodVisits);
    const periodRevenue = series.reduce(
      (total, item) => total + item.revenue,
      0,
    );
    const periodSuccessfulOpens = series.reduce(
      (total, item) => total + item.successfulOpens,
      0,
    );
    const periodEarnedViews = series.reduce(
      (total, item) => total + item.earnedViews,
      0,
    );
    const periodAverageCpm = this.averageCpm(
      periodRevenue,
      periodEarnedViews,
    );
    const comparisonRevenue = comparisonVisits.reduce(
      (total, visit) => total + visit.revenue.toNumber(),
      0,
    );
    const comparisonSuccessfulOpens = comparisonVisits.length;
    const comparisonEarnedViews = comparisonVisits.filter(
      (visit) => visit.isEarn,
    ).length;
    const comparisonAverageCpm = this.averageCpm(
      comparisonRevenue,
      comparisonEarnedViews,
    );
    const today =
      this.buildSeries(todayStart, 1, todayVisits)[0] ??
      this.emptySeriesPoint(todayStart);

    return {
      member: {
        name: user.name,
        balance: user.balance.toString(),
      },
      analytics: {
        periodDays,
        period: { from: periodStart, to: periodEnd },
        metrics: {
          revenue: periodRevenue,
          successfulOpens: periodSuccessfulOpens,
          earnedViews: periodEarnedViews,
          averageCpm: periodAverageCpm,
        },
        changes: {
          revenue: this.percentageChange(periodRevenue, comparisonRevenue),
          successfulOpens: this.percentageChange(
            periodSuccessfulOpens,
            comparisonSuccessfulOpens,
          ),
          earnedViews: this.percentageChange(
            periodEarnedViews,
            comparisonEarnedViews,
          ),
          averageCpm: this.percentageChange(
            periodAverageCpm,
            comparisonAverageCpm,
          ),
        },
        today: {
          revenue: today.revenue,
          successfulOpens: today.successfulOpens,
          earnedViews: today.earnedViews,
          averageCpm: today.averageCpm,
        },
        series,
        breakdowns: {
          countries: countryGroups.map((item) => ({
            key: item.country,
            count: item._count._all,
          })),
          devices: deviceGroups.map((item) => ({
            key: this.deviceLabel(item.device),
            count: item._count._all,
          })),
          browsers: [...browserCounts.entries()]
            .map(([key, count]) => ({ key, count }))
            .sort((left, right) => right.count - left.count)
            .slice(0, 5),
        },
        topLinks: topLinkIds.flatMap((linkId) => {
          const link = topLinkById.get(linkId);
          const metric = topLinkCounts.get(linkId);
          return link && metric
            ? [
                {
                  ...link,
                  successfulOpens: metric.successfulOpens,
                  revenue: metric.revenue.toNumber(),
                },
              ]
            : [];
        }),
      },
    };
  }

  private resolvePeriod(range: MemberDashboardRange, now: Date) {
    const periodStart = new Date(now);
    const periodEnd = new Date(now);

    if (range === "today") {
      periodStart.setUTCHours(0, 0, 0, 0);
      return { periodDays: 1, periodStart, periodEnd };
    }

    if (range === "yesterday") {
      periodStart.setUTCDate(periodStart.getUTCDate() - 1);
      periodStart.setUTCHours(0, 0, 0, 0);
      periodEnd.setUTCHours(0, 0, 0, 0);
      periodEnd.setUTCMilliseconds(-1);
      return { periodDays: 1, periodStart, periodEnd };
    }

    const periodDays = rangeDays[range];
    periodStart.setUTCDate(periodStart.getUTCDate() - periodDays + 1);
    periodStart.setUTCHours(0, 0, 0, 0);
    return { periodDays, periodStart, periodEnd };
  }

  private async browserCounts(
    groups: Array<{ agentHash: string; _count: { _all: number } }>,
  ) {
    const userAgents = groups.length
      ? await this.prisma.userAgent.findMany({
          where: { hash: { in: groups.map((item) => item.agentHash) } },
          select: { hash: true, browser: true },
        })
      : [];
    const browserByHash = new Map(
      userAgents.map((agent) => [agent.hash, agent.browser]),
    );
    const counts = new Map<string, number>();

    for (const group of groups) {
      const browser = browserByHash.get(group.agentHash) ?? "other";
      counts.set(browser, (counts.get(browser) ?? 0) + group._count._all);
    }

    return counts;
  }

  private buildSeries(from: Date, days: number, visits: PeriodVisit[]) {
    const daily = new Map<
      string,
      { successfulOpens: number; earnedViews: number; revenue: number }
    >();

    for (const visit of visits) {
      if (!visit.completedAt) continue;
      const key = visit.completedAt.toISOString().slice(0, 10);
      const current = daily.get(key) ?? {
        successfulOpens: 0,
        earnedViews: 0,
        revenue: 0,
      };
      current.successfulOpens += 1;
      current.earnedViews += visit.isEarn ? 1 : 0;
      current.revenue += visit.revenue.toNumber();
      daily.set(key, current);
    }

    return Array.from({ length: days }, (_, index) => {
      const date = new Date(from);
      date.setUTCDate(from.getUTCDate() + index);
      const key = date.toISOString().slice(0, 10);
      const item = daily.get(key) ?? {
        successfulOpens: 0,
        earnedViews: 0,
        revenue: 0,
      };

      return {
        date: key,
        ...item,
        averageCpm: this.averageCpm(item.revenue, item.earnedViews),
      };
    });
  }

  private emptySeriesPoint(date: Date) {
    return {
      date: date.toISOString().slice(0, 10),
      successfulOpens: 0,
      earnedViews: 0,
      revenue: 0,
      averageCpm: 0,
    };
  }

  private averageCpm(revenue: number, earnedViews: number) {
    return earnedViews > 0 ? (revenue / earnedViews) * 1_000 : 0;
  }

  private percentageChange(current: number, previous: number) {
    if (previous === 0) return current === 0 ? 0 : null;
    return ((current - previous) / Math.abs(previous)) * 100;
  }

  private deviceLabel(device: number) {
    const resolved = DEVICE_TYPE_NAMES[device];
    return resolved === "unknown" || !resolved ? "desktop" : resolved;
  }
}
