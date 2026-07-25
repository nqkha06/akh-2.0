import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";

type PeriodVisit = {
  completedAt: Date | null;
  isEarn: boolean;
  revenue: Prisma.Decimal;
  linkId: number;
};

@Injectable()
export class MemberDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(userId: number) {
    const periodDays = 30;
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd);
    periodStart.setUTCDate(periodStart.getUTCDate() - periodDays + 1);
    periodStart.setUTCHours(0, 0, 0, 0);

    const periodVisitWhere: Prisma.LinkAccessLogWhereInput = {
      link: { userId, deletedAt: null },
      completedAt: { not: null, gte: periodStart, lte: periodEnd },
    };

    const [user, periodVisits, countryGroups, deviceGroups, browserGroups] =
      await this.prisma.$transaction([
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
    const today =
      series[series.length - 1] ?? this.emptySeriesPoint(periodEnd);

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
          averageCpm: this.averageCpm(periodRevenue, periodEarnedViews),
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

  private deviceLabel(device: number) {
    if (device === 1) return "mobile";
    if (device === 3) return "tablet";
    return "desktop";
  }
}
