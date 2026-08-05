import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";
import type { AuthenticatedUser } from "../auth/auth.types";
import type { AccessAnalysisQueryDto } from "./dto/access-analysis-query.dto";
import {
  evaluateAccessFraudRules,
  type AccessAnalysisContext,
} from "./rules/access-fraud.rules";
import { StuAccessLogsService } from "./stu-access-logs.service";

type AnalysisSubject =
  | { kind: "user"; id: number }
  | { kind: "link"; id: number }
  | { kind: "ip"; ip: string };

type Numeric = bigint | number | string | Date | null;

type SummaryRow = {
  totalRequests: Numeric;
  earnedRequests: Numeric;
  rejectedRequests: Numeric;
  totalRevenue: Numeric;
  uniqueIps: Numeric;
  uniqueAgents: Numeric;
  uniqueCountries: Numeric;
  uniqueLinks: Numeric;
};

type TopIpRow = {
  ipAddress: string;
  requestCount: Numeric;
  earnedRequestCount: Numeric;
  revenue: Numeric;
  distinctLinkCount: Numeric;
  distinctUserCount: Numeric;
  firstSeenAt: Numeric;
  lastSeenAt: Numeric;
};

@Injectable()
export class AdminAccessAnalysisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessLogs: StuAccessLogsService,
  ) {}

  async analyzeUser(
    userId: number,
    query: AccessAnalysisQueryDto,
    currentUser: AuthenticatedUser,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
    if (!user) throw new NotFoundException("Người dùng không tồn tại.");
    return {
      user,
      ...(await this.analyze({ kind: "user", id: userId }, query, currentUser)),
    };
  }

  async analyzeIp(
    ip: string,
    query: AccessAnalysisQueryDto,
    currentUser: AuthenticatedUser,
  ) {
    return {
      ipAddress: this.accessLogs.presentIp(
        ip,
        currentUser.permissions.includes("stu_access_logs.view_sensitive"),
      ),
      ...(await this.analyze({ kind: "ip", ip }, query, currentUser)),
    };
  }

  async analyzeLink(
    linkId: number,
    query: AccessAnalysisQueryDto,
    currentUser: AuthenticatedUser,
  ) {
    const link = await this.prisma.link.findUnique({
      where: { id: linkId },
      select: {
        id: true,
        title: true,
        slug: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
    if (!link) throw new NotFoundException("Social link không tồn tại.");
    return {
      link,
      ...(await this.analyze({ kind: "link", id: linkId }, query, currentUser)),
    };
  }

  private async analyze(
    subject: AnalysisSubject,
    query: AccessAnalysisQueryDto,
    currentUser: AuthenticatedUser,
  ) {
    const period = this.accessLogs.resolvePeriod(query.from, query.to);
    const condition = this.subjectCondition(subject, "l");
    const previousFrom = new Date(
      period.from.getTime() - (period.to.getTime() - period.from.getTime()),
    );
    const recent24hFrom = new Date(
      Math.max(period.from.getTime(), period.to.getTime() - 86_400_000),
    );
    const bucketFormat =
      period.to.getTime() - period.from.getTime() > 2 * 86_400_000
        ? "%Y-%m-%dT00:00:00Z"
        : "%Y-%m-%dT%H:00:00Z";

    const [
      summaryRows,
      topIpRows,
      topAgentRows,
      topLinkRows,
      countryRows,
      timelineRows,
      velocity60,
      velocity300,
      velocity3600,
      previousRows,
      countryChangeRows,
      countryHourRows,
      country24hRows,
    ] = await Promise.all([
      this.prisma.$queryRaw<SummaryRow[]>(Prisma.sql`
        SELECT COUNT(*) AS "totalRequests",
               SUM(CASE WHEN l."is_earn" = 1 THEN 1 ELSE 0 END) AS "earnedRequests",
               SUM(CASE WHEN l."reject_reason_mask" <> 0 THEN 1 ELSE 0 END) AS "rejectedRequests",
               COALESCE(SUM(CASE WHEN l."is_earn" = 1 THEN l."revenue" ELSE 0 END), 0) AS "totalRevenue",
               COUNT(DISTINCT NULLIF(l."ip_address", '')) AS "uniqueIps",
               COUNT(DISTINCT NULLIF(l."agent_hash", '')) AS "uniqueAgents",
               COUNT(DISTINCT CASE WHEN l."country" NOT IN ('', 'ZZ', 'unknown') THEN l."country" END) AS "uniqueCountries",
               COUNT(DISTINCT l."link_id") AS "uniqueLinks"
        FROM "stu_access_logs" l
        WHERE ${condition}
          AND l."created_at" >= ${period.from}
          AND l."created_at" <= ${period.to}
      `),
      this.prisma.$queryRaw<TopIpRow[]>(Prisma.sql`
        SELECT l."ip_address" AS "ipAddress",
               COUNT(*) AS "requestCount",
               SUM(CASE WHEN l."is_earn" = 1 THEN 1 ELSE 0 END) AS "earnedRequestCount",
               COALESCE(SUM(CASE WHEN l."is_earn" = 1 THEN l."revenue" ELSE 0 END), 0) AS "revenue",
               COUNT(DISTINCT l."link_id") AS "distinctLinkCount",
               (SELECT COUNT(DISTINCT owners."user_id")
                  FROM "stu_access_logs" owners
                 WHERE owners."ip_address" = l."ip_address"
                   AND owners."created_at" >= ${period.from}
                   AND owners."created_at" <= ${period.to}) AS "distinctUserCount",
               MIN(l."created_at") AS "firstSeenAt",
               MAX(l."created_at") AS "lastSeenAt"
        FROM "stu_access_logs" l
        WHERE ${condition}
          AND l."created_at" >= ${period.from}
          AND l."created_at" <= ${period.to}
          AND l."ip_address" IS NOT NULL
          AND l."ip_address" <> ''
        GROUP BY l."ip_address"
        ORDER BY "requestCount" DESC
        LIMIT 20
      `),
      this.prisma.$queryRaw<
        Array<{
          agentHash: string;
          requestCount: Numeric;
          revenue: Numeric;
          distinctIpCount: Numeric;
          distinctLinkCount: Numeric;
          distinctUserCount: Numeric;
        }>
      >(Prisma.sql`
        SELECT l."agent_hash" AS "agentHash",
               COUNT(*) AS "requestCount",
               COALESCE(SUM(CASE WHEN l."is_earn" = 1 THEN l."revenue" ELSE 0 END), 0) AS "revenue",
               COUNT(DISTINCT l."ip_address") AS "distinctIpCount",
               COUNT(DISTINCT l."link_id") AS "distinctLinkCount",
               (SELECT COUNT(DISTINCT owners."user_id")
                  FROM "stu_access_logs" owners
                 WHERE owners."agent_hash" = l."agent_hash"
                   AND owners."created_at" >= ${period.from}
                   AND owners."created_at" <= ${period.to}) AS "distinctUserCount"
        FROM "stu_access_logs" l
        WHERE ${condition}
          AND l."created_at" >= ${period.from}
          AND l."created_at" <= ${period.to}
        GROUP BY l."agent_hash"
        ORDER BY "requestCount" DESC
        LIMIT 20
      `),
      this.prisma.$queryRaw<
        Array<{
          linkId: number;
          title: string;
          slug: string;
          requestCount: Numeric;
          earnedRequestCount: Numeric;
          revenue: Numeric;
          distinctIpCount: Numeric;
        }>
      >(Prisma.sql`
        SELECT l."link_id" AS "linkId", links."title" AS "title", links."slug" AS "slug",
               COUNT(*) AS "requestCount",
               SUM(CASE WHEN l."is_earn" = 1 THEN 1 ELSE 0 END) AS "earnedRequestCount",
               COALESCE(SUM(CASE WHEN l."is_earn" = 1 THEN l."revenue" ELSE 0 END), 0) AS "revenue",
               COUNT(DISTINCT l."ip_address") AS "distinctIpCount"
        FROM "stu_access_logs" l
        JOIN "stu_links" links ON links."id" = l."link_id"
        WHERE ${condition}
          AND l."created_at" >= ${period.from}
          AND l."created_at" <= ${period.to}
        GROUP BY l."link_id", links."title", links."slug"
        ORDER BY "requestCount" DESC
        LIMIT 20
      `),
      this.prisma.$queryRaw<
        Array<{ country: string; requestCount: Numeric; revenue: Numeric }>
      >(Prisma.sql`
        SELECT l."country" AS "country", COUNT(*) AS "requestCount",
               COALESCE(SUM(CASE WHEN l."is_earn" = 1 THEN l."revenue" ELSE 0 END), 0) AS "revenue"
        FROM "stu_access_logs" l
        WHERE ${condition}
          AND l."created_at" >= ${period.from}
          AND l."created_at" <= ${period.to}
          AND l."country" NOT IN ('', 'ZZ', 'unknown')
        GROUP BY l."country"
        ORDER BY "requestCount" DESC
        LIMIT 50
      `),
      this.prisma.$queryRaw<
        Array<{ bucket: string; requestCount: Numeric; revenue: Numeric }>
      >(Prisma.sql`
        SELECT strftime(${bucketFormat}, l."created_at" / 1000, 'unixepoch') AS "bucket",
               COUNT(*) AS "requestCount",
               COALESCE(SUM(CASE WHEN l."is_earn" = 1 THEN l."revenue" ELSE 0 END), 0) AS "revenue"
        FROM "stu_access_logs" l
        WHERE ${condition}
          AND l."created_at" >= ${period.from}
          AND l."created_at" <= ${period.to}
        GROUP BY "bucket"
        ORDER BY "bucket" ASC
      `),
      this.velocity(condition, period, 60),
      this.velocity(condition, period, 300),
      this.velocity(condition, period, 3_600),
      this.prisma.$queryRaw<Array<{ requestCount: Numeric }>>(Prisma.sql`
        SELECT COUNT(*) AS "requestCount"
        FROM "stu_access_logs" l
        WHERE ${condition}
          AND l."created_at" >= ${previousFrom}
          AND l."created_at" < ${period.from}
      `),
      this.prisma.$queryRaw<Array<{ shortestMinutes: Numeric }>>(Prisma.sql`
        WITH ordered AS (
          SELECT l."country" AS country, l."created_at" AS created_at,
                 LAG(l."country") OVER (ORDER BY l."created_at") AS previous_country,
                 LAG(l."created_at") OVER (ORDER BY l."created_at") AS previous_at
          FROM "stu_access_logs" l
          WHERE ${condition}
            AND l."created_at" >= ${period.from}
            AND l."created_at" <= ${period.to}
            AND l."country" NOT IN ('', 'ZZ', 'unknown')
        )
        SELECT MIN((created_at - previous_at) / 60000.0) AS "shortestMinutes"
        FROM ordered
        WHERE previous_country IS NOT NULL AND country <> previous_country
      `),
      this.prisma.$queryRaw<Array<{ countryCount: Numeric }>>(Prisma.sql`
        SELECT COUNT(DISTINCT l."country") AS "countryCount"
        FROM "stu_access_logs" l
        WHERE ${condition}
          AND l."created_at" >= ${period.from}
          AND l."created_at" <= ${period.to}
          AND l."country" NOT IN ('', 'ZZ', 'unknown')
        GROUP BY strftime('%Y-%m-%dT%H', l."created_at" / 1000, 'unixepoch')
        ORDER BY "countryCount" DESC
        LIMIT 1
      `),
      this.prisma.$queryRaw<Array<{ countryCount: Numeric }>>(Prisma.sql`
        SELECT COUNT(DISTINCT l."country") AS "countryCount"
        FROM "stu_access_logs" l
        WHERE ${condition}
          AND l."created_at" >= ${recent24hFrom}
          AND l."created_at" <= ${period.to}
          AND l."country" NOT IN ('', 'ZZ', 'unknown')
      `),
    ]);

    const summary = summaryRows[0] ?? this.emptySummary();
    const topIps = topIpRows.map((item) => ({
      ipAddress: item.ipAddress,
      requestCount: this.number(item.requestCount),
      earnedRequestCount: this.number(item.earnedRequestCount),
      revenue: this.number(item.revenue),
      distinctLinkCount: this.number(item.distinctLinkCount),
      distinctUserCount: this.number(item.distinctUserCount),
      firstSeenAt: this.dateString(item.firstSeenAt),
      lastSeenAt: this.dateString(item.lastSeenAt),
    }));
    const context: AccessAnalysisContext = {
      totalRequests: this.number(summary.totalRequests),
      totalRevenue: this.number(summary.totalRevenue),
      previousPeriodRequests: this.number(previousRows[0]?.requestCount),
      velocity: [velocity60[0], velocity300[0], velocity3600[0]].flatMap(
        (item) =>
          item
            ? [
                {
                  ipAddress: item.ipAddress,
                  requestCount: this.number(item.requestCount),
                  windowSeconds: Number(item.windowSeconds),
                },
              ]
            : [],
      ),
      topIps,
      sharedAgent: topAgentRows[0]
        ? {
            agentHash: topAgentRows[0].agentHash,
            distinctUserCount: this.number(topAgentRows[0].distinctUserCount),
            requestCount: this.number(topAgentRows[0].requestCount),
          }
        : null,
      countries: {
        validCountryCount24h: this.number(country24hRows[0]?.countryCount),
        maxCountriesInHour: this.number(countryHourRows[0]?.countryCount),
        shortestChangeMinutes:
          countryChangeRows[0]?.shortestMinutes === null ||
          countryChangeRows[0]?.shortestMinutes === undefined
            ? null
            : this.number(countryChangeRows[0].shortestMinutes),
        values: countryRows.map((item) => item.country),
      },
    };
    const risk = evaluateAccessFraudRules(context);
    const canViewSensitive = currentUser.permissions.includes(
      "stu_access_logs.view_sensitive",
    );
    return {
      period,
      summary: {
        totalRequests: context.totalRequests,
        earnedRequests: this.number(summary.earnedRequests),
        rejectedRequests: this.number(summary.rejectedRequests),
        totalRevenue: String(summary.totalRevenue ?? 0),
        uniqueIps: this.number(summary.uniqueIps),
        uniqueAgents: this.number(summary.uniqueAgents),
        uniqueCountries: this.number(summary.uniqueCountries),
        uniqueLinks: this.number(summary.uniqueLinks),
      },
      risk: {
        score: risk.score,
        level: risk.level,
        triggeredRuleCount: risk.triggeredRuleCount,
      },
      reasons: risk.reasons.map((reason) =>
        this.presentReason(reason, canViewSensitive),
      ),
      topIps: topIps.map((item) => ({
        ...item,
        ipAddress: this.accessLogs.presentIp(item.ipAddress, canViewSensitive),
        revenue: String(item.revenue),
      })),
      topAgents: topAgentRows.map((item) => ({
        agentHash: item.agentHash,
        requestCount: this.number(item.requestCount),
        revenue: String(item.revenue ?? 0),
        distinctIpCount: this.number(item.distinctIpCount),
        distinctLinkCount: this.number(item.distinctLinkCount),
        distinctUserCount: this.number(item.distinctUserCount),
        signalStrength: "weak",
      })),
      topLinks: topLinkRows.map((item) => ({
        linkId: Number(item.linkId),
        title: item.title,
        slug: item.slug,
        requestCount: this.number(item.requestCount),
        earnedRequestCount: this.number(item.earnedRequestCount),
        revenue: String(item.revenue ?? 0),
        distinctIpCount: this.number(item.distinctIpCount),
      })),
      countryDistribution: countryRows.map((item) => ({
        country: item.country,
        requestCount: this.number(item.requestCount),
        revenue: String(item.revenue ?? 0),
      })),
      trafficTimeline: timelineRows.map((item) => ({
        bucket: item.bucket,
        requestCount: this.number(item.requestCount),
        revenue: String(item.revenue ?? 0),
      })),
      comparison: {
        previousPeriodRequests: context.previousPeriodRequests,
      },
      ruleStatuses: [
        {
          code: "REGULAR_REQUEST_INTERVAL",
          status: query.advanced ? "insufficient_data" : "not_requested",
          message:
            "Interval analysis không chạy mặc định để giới hạn raw timestamp và bảo vệ hiệu năng.",
        },
        {
          code: "PROXY_VPN_DATACENTER",
          status: "not_supported",
          message: "Hệ thống chưa lưu dữ liệu proxy, VPN hoặc datacenter.",
        },
      ],
    };
  }

  private velocity(
    condition: Prisma.Sql,
    period: { from: Date; to: Date },
    windowSeconds: number,
  ) {
    if (![60, 300, 3_600].includes(windowSeconds)) {
      throw new BadRequestException("Cửa sổ velocity không hợp lệ.");
    }
    return this.prisma.$queryRaw<
      Array<{ ipAddress: string; requestCount: Numeric; windowSeconds: number }>
    >(Prisma.sql`
      SELECT l."ip_address" AS "ipAddress", COUNT(*) AS "requestCount",
             ${windowSeconds} AS "windowSeconds"
      FROM "stu_access_logs" l
      WHERE ${condition}
        AND l."created_at" >= ${period.from}
        AND l."created_at" <= ${period.to}
        AND l."ip_address" IS NOT NULL
        AND l."ip_address" <> ''
      GROUP BY l."ip_address", CAST(l."created_at" / 1000 AS INTEGER) / ${windowSeconds}
      ORDER BY "requestCount" DESC
      LIMIT 1
    `);
  }

  private subjectCondition(subject: AnalysisSubject, alias: string) {
    if (alias !== "l") throw new BadRequestException("Alias truy vấn không hợp lệ.");
    if (subject.kind === "user") return Prisma.sql`l."user_id" = ${subject.id}`;
    if (subject.kind === "link") return Prisma.sql`l."link_id" = ${subject.id}`;
    return Prisma.sql`l."ip_address" = ${subject.ip}`;
  }

  private presentReason(
    reason: ReturnType<typeof evaluateAccessFraudRules>["reasons"][number],
    canViewSensitive: boolean,
  ) {
    const evidence = { ...(reason.evidence ?? {}) };
    if (typeof evidence.ipAddress === "string") {
      evidence.ipAddress = this.accessLogs.presentIp(
        evidence.ipAddress,
        canViewSensitive,
      );
    }
    return { ...reason, evidence };
  }

  private number(value: Numeric | undefined) {
    const result = Number(value ?? 0);
    return Number.isFinite(result) ? result : 0;
  }

  private dateString(value: Numeric) {
    if (value === null) return "";
    if (value instanceof Date) return value.toISOString();
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return new Date(numeric).toISOString();
    return String(value);
  }

  private emptySummary(): SummaryRow {
    return {
      totalRequests: 0,
      earnedRequests: 0,
      rejectedRequests: 0,
      totalRevenue: 0,
      uniqueIps: 0,
      uniqueAgents: 0,
      uniqueCountries: 0,
      uniqueLinks: 0,
    };
  }
}
