import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { DEVICE_TYPE_NAMES } from "@stu/contracts";

import { PrismaService } from "../../database/prisma/prisma.service";
import type { AdminDashboardRange } from "./dto/admin-dashboard-query.dto";

const rangeDays: Record<AdminDashboardRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(range: AdminDashboardRange) {
    const days = rangeDays[range];
    const to = new Date();
    const from = new Date(to);
    from.setUTCDate(from.getUTCDate() - days + 1);
    from.setUTCHours(0, 0, 0, 0);
    const visitWhere: Prisma.LinkAccessLogWhereInput = {
      completedAt: { not: null, gte: from, lte: to },
      link: { deletedAt: null },
    };

    const [
      membersTotal,
      newMembers,
      linksTotal,
      activeLinks,
      unlocks,
      uniqueIps,
      pendingWithdrawals,
      openTickets,
      pendingReports,
      visitDates,
      countryGroups,
      deviceGroups,
      browserGroups,
      topLinkGroups,
      recentVisits,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { roles: { some: { role: { key: "member" } } } },
      }),
      this.prisma.user.count({
        where: {
          createdAt: { gte: from, lte: to },
          roles: { some: { role: { key: "member" } } },
        },
      }),
      this.prisma.link.count({ where: { deletedAt: null } }),
      this.prisma.link.count({
        where: { deletedAt: null, status: "active" },
      }),
      this.prisma.linkAccessLog.count({ where: visitWhere }),
      this.prisma.linkAccessLog.findMany({
        where: { ...visitWhere, ipAddress: { not: null } },
        distinct: ["ipAddress"],
        select: { ipAddress: true },
      }),
      this.prisma.userWithdrawal.count({ where: { status: "pending" } }),
      this.prisma.supportTicket.count({
        where: {
          deletedAt: null,
          status: {
            in: ["submitted", "in_progress", "waiting_user", "answered"],
          },
        },
      }),
      this.prisma.linkReport.count({
        where: { deletedAt: null, status: { in: ["pending", "reviewing"] } },
      }),
      this.prisma.linkAccessLog.findMany({
        where: visitWhere,
        select: { completedAt: true },
      }),
      this.prisma.linkAccessLog.groupBy({
        by: ["country"],
        where: visitWhere,
        _count: { _all: true },
        orderBy: { _count: { country: "desc" } },
        take: 6,
      }),
      this.prisma.linkAccessLog.groupBy({
        by: ["device"],
        where: visitWhere,
        _count: { _all: true },
        orderBy: { _count: { device: "desc" } },
      }),
      this.prisma.linkAccessLog.groupBy({
        by: ["agentHash"],
        where: visitWhere,
        _count: { _all: true },
      }),
      this.prisma.linkAccessLog.groupBy({
        by: ["linkId"],
        where: visitWhere,
        _count: { _all: true },
        orderBy: { _count: { linkId: "desc" } },
        take: 5,
      }),
      this.prisma.linkAccessLog.findMany({
        where: visitWhere,
        orderBy: { completedAt: "desc" },
        take: 10,
        include: {
          userAgent: { select: { browser: true } },
          link: {
            select: {
              id: true,
              slug: true,
              title: true,
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      }),
    ]);

    const topLinkIds = topLinkGroups.map((item) => item.linkId);
    const topLinks = topLinkIds.length
      ? await this.prisma.link.findMany({
          where: { id: { in: topLinkIds } },
          select: {
            id: true,
            slug: true,
            title: true,
            user: { select: { id: true, name: true, email: true } },
          },
        })
      : [];
    const topLinkMap = new Map(topLinks.map((link) => [link.id, link]));
    const userAgents = browserGroups.length
      ? await this.prisma.userAgent.findMany({
          where: { hash: { in: browserGroups.map((item) => item.agentHash) } },
          select: { hash: true, browser: true },
        })
      : [];
    const browserByHash = new Map(
      userAgents.map((agent) => [agent.hash, agent.browser]),
    );
    const browserCounts = new Map<string, number>();
    for (const group of browserGroups) {
      const browser = browserByHash.get(group.agentHash) ?? "other";
      browserCounts.set(
        browser,
        (browserCounts.get(browser) ?? 0) + group._count._all,
      );
    }

    return {
      range,
      period: { from, to },
      metrics: {
        membersTotal,
        newMembers,
        linksTotal,
        activeLinks,
        unlocks,
        uniqueIps: uniqueIps.length,
      },
      operations: {
        pendingWithdrawals,
        openTickets,
        pendingReports,
      },
      series: this.buildSeries(from, days, visitDates),
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
          .sort((left, right) => right.count - left.count),
      },
      topLinks: topLinkGroups.flatMap((item) => {
        const link = topLinkMap.get(item.linkId);
        return link
          ? [{ ...link, unlocks: item._count._all }]
          : [];
      }),
      recentUnlocks: recentVisits.map((item) => ({
        id: item.id,
        countryCode: item.country,
        deviceType: this.deviceLabel(item.device),
        browserFamily: item.userAgent.browser,
        ipAddress: item.ipAddress,
        createdAt: item.completedAt,
        link: item.link,
      })),
    };
  }

  private buildSeries(
    from: Date,
    days: number,
    visits: Array<{ completedAt: Date | null }>,
  ) {
    const counts = new Map<string, number>();
    for (const visit of visits) {
      if (!visit.completedAt) continue;
      const key = visit.completedAt.toISOString().slice(0, 10);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return Array.from({ length: days }, (_, index) => {
      const date = new Date(from);
      date.setUTCDate(from.getUTCDate() + index);
      const key = date.toISOString().slice(0, 10);
      return { date: key, unlocks: counts.get(key) ?? 0 };
    });
  }

  private deviceLabel(device: number) {
    const resolved = DEVICE_TYPE_NAMES[device];
    return resolved === "unknown" || !resolved ? "desktop" : resolved;
  }
}
