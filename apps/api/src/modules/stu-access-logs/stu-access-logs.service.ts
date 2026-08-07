import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { DEVICE_TYPE_NAMES } from "@stu/contracts";

import { PrismaService } from "../../database/prisma/prisma.service";
import type { AuthenticatedUser } from "../auth/auth.types";
import { ListStuAccessLogsQueryDto } from "./dto/list-stu-access-logs-query.dto";
import type { ReviewAccessLogDto } from "./dto/review-access-log.dto";

const MAX_RANGE_MS = 30 * 24 * 60 * 60 * 1_000;
const DEFAULT_RANGE_MS = 24 * 60 * 60 * 1_000;

const listSelect = {
  id: true,
  linkId: true,
  userId: true,
  ipAddress: true,
  country: true,
  device: true,
  revenue: true,
  isEarn: true,
  detectionMask: true,
  rejectReasonMask: true,
  completedAt: true,
  processedAt: true,
  createdAt: true,
  user: { select: { id: true, name: true, email: true, avatar: true } },
  link: { select: { id: true, slug: true, title: true } },
  review: {
    select: {
      status: true,
      note: true,
      reviewedAt: true,
      reviewedBy: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.LinkAccessLogSelect;

type ListRecord = Prisma.LinkAccessLogGetPayload<{ select: typeof listSelect }>;

@Injectable()
export class StuAccessLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: ListStuAccessLogsQueryDto,
    currentUser: AuthenticatedUser,
  ) {
    const period = this.resolvePeriod(query.from, query.to);
    const where = this.buildWhere(query, period);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.linkAccessLog.findMany({
        where,
        select: listSelect,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: (query.page - 1) * query.perPage,
        take: query.perPage,
      }),
      this.prisma.linkAccessLog.count({ where }),
    ]);
    const canViewSensitive = currentUser.permissions.includes(
      "stu_access_logs.view_sensitive",
    );
    return {
      items: items.map((item) => this.toListItem(item, canViewSensitive)),
      page: query.page,
      perPage: query.perPage,
      total,
      pageCount: Math.max(1, Math.ceil(total / query.perPage)),
      period,
    };
  }

  async stats(currentUser: AuthenticatedUser) {
    const to = new Date();
    const from = new Date(to);
    from.setUTCHours(0, 0, 0, 0);
    const periodWhere: Prisma.LinkAccessLogWhereInput = {
      createdAt: { gte: from, lte: to },
    };
    const suspiciousWhere: Prisma.LinkAccessLogWhereInput = {
      ...periodWhere,
      OR: [{ detectionMask: { gt: 0 } }, { rejectReasonMask: { gt: 0 } }],
    };
    const [
      totalRequests,
      earnedRequests,
      rejectedRequests,
      highRiskLogs,
      unreviewedLogs,
      suspiciousRevenue,
      ipGroups,
      userGroups,
      linkGroups,
      timelineRows,
    ] = await Promise.all([
      this.prisma.linkAccessLog.count({ where: periodWhere }),
      this.prisma.linkAccessLog.count({
        where: { ...periodWhere, isEarn: true },
      }),
      this.prisma.linkAccessLog.count({
        where: { ...periodWhere, rejectReasonMask: { gt: 0 } },
      }),
      this.prisma.linkAccessLog.count({
        where: {
          ...periodWhere,
          detectionMask: { gt: 0 },
          rejectReasonMask: { gt: 0 },
        },
      }),
      this.prisma.linkAccessLog.count({
        where: { ...periodWhere, review: null },
      }),
      this.prisma.linkAccessLog.aggregate({
        where: { ...suspiciousWhere, isEarn: true },
        _sum: { revenue: true },
      }),
      this.prisma.linkAccessLog.groupBy({
        by: ["ipAddress"],
        where: { ...suspiciousWhere, ipAddress: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { ipAddress: "desc" } },
        take: 5,
      }),
      this.prisma.linkAccessLog.groupBy({
        by: ["userId"],
        where: suspiciousWhere,
        _count: { _all: true },
        orderBy: { _count: { userId: "desc" } },
        take: 5,
      }),
      this.prisma.linkAccessLog.groupBy({
        by: ["linkId"],
        where: suspiciousWhere,
        _count: { _all: true },
        orderBy: { _count: { linkId: "desc" } },
        take: 5,
      }),
      this.prisma.$queryRaw<Array<{ bucket: string; count: bigint }>>(
        Prisma.sql`
          SELECT strftime('%Y-%m-%dT%H:00:00Z', "created_at" / 1000, 'unixepoch') AS "bucket",
                 COUNT(*) AS "count"
          FROM "stu_access_logs"
          WHERE "created_at" >= ${from} AND "created_at" <= ${to}
          GROUP BY "bucket"
          ORDER BY "bucket" ASC
        `,
      ),
    ]);
    const [users, links] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: userGroups.map((item) => item.userId) } },
        select: { id: true, name: true, email: true },
      }),
      this.prisma.link.findMany({
        where: { id: { in: linkGroups.map((item) => item.linkId) } },
        select: { id: true, title: true, slug: true },
      }),
    ]);
    const userById = new Map(users.map((user) => [user.id, user]));
    const linkById = new Map(links.map((link) => [link.id, link]));
    const canViewSensitive = currentUser.permissions.includes(
      "stu_access_logs.view_sensitive",
    );
    return {
      period: { from, to },
      metrics: {
        totalRequests,
        earnedRequests,
        rejectedRequests,
        highRiskLogs,
        unreviewedLogs,
        suspiciousRevenue:
          suspiciousRevenue._sum.revenue?.toString() ?? "0",
      },
      topIps: ipGroups.map((item) => ({
        ipAddress: this.presentIp(item.ipAddress, canViewSensitive),
        requestCount: item._count._all,
      })),
      topUsers: userGroups.flatMap((item) => {
        const user = userById.get(item.userId);
        return user ? [{ ...user, requestCount: item._count._all }] : [];
      }),
      topLinks: linkGroups.flatMap((item) => {
        const link = linkById.get(item.linkId);
        return link ? [{ ...link, requestCount: item._count._all }] : [];
      }),
      timeline: timelineRows.map((item) => ({
        bucket: item.bucket,
        requestCount: this.toNumber(item.count),
      })),
      note:
        "Risk cao chỉ đếm log có cả detection mask và reject mask; risk score on-demand không được lưu.",
    };
  }

  async findOne(id: string, currentUser: AuthenticatedUser) {
    const record = await this.prisma.linkAccessLog.findUnique({
      where: { id },
      select: {
        ...listSelect,
        levelId: true,
        agentHash: true,
        referrer: true,
        payoutCpm: true,
        userAgent: {
          select: { raw: true, browser: true, os: true, deviceType: true },
        },
      },
    });
    if (!record) throw new NotFoundException("Access log không tồn tại.");
    const canViewSensitive = currentUser.permissions.includes(
      "stu_access_logs.view_sensitive",
    );
    const [level, related] = await Promise.all([
      record.levelId
        ? this.prisma.monetizationLevel.findUnique({
            where: { id: record.levelId },
            select: {
              id: true,
              key: true,
              translations: { select: { locale: true, name: true } },
            },
          })
        : null,
      this.relatedStats(record),
    ]);
    return {
      ...this.toListItem(record, canViewSensitive),
      level: level
        ? {
            id: level.id,
            key: level.key,
            name:
              level.translations.find((item) => item.locale === "vi")?.name ??
              level.translations.find((item) => item.locale === "en")?.name ??
              level.key,
          }
        : null,
      agentHash: record.agentHash,
      userAgent: record.userAgent,
      referrer: record.referrer,
      payoutCpm: record.payoutCpm.toString(),
      related: {
        ...related,
        links: related.links,
      },
    };
  }

  async review(
    id: string,
    dto: ReviewAccessLogDto,
    currentUser: AuthenticatedUser,
  ) {
    await this.assertExists(id);
    const note = dto.note?.trim() || null;
    await this.prisma.accessLogReview.upsert({
      where: { accessLogId: id },
      create: {
        accessLogId: id,
        status: dto.status,
        note,
        reviewedById: currentUser.id,
      },
      update: {
        status: dto.status,
        note,
        reviewedById: currentUser.id,
        reviewedAt: new Date(),
      },
    });
    return this.findOne(id, currentUser);
  }

  async findForUser(
    userId: number,
    query: ListStuAccessLogsQueryDto,
    currentUser: AuthenticatedUser,
  ) {
    return this.findAll(
      Object.assign(new ListStuAccessLogsQueryDto(), query, { userId }),
      currentUser,
    );
  }

  resolvePeriod(fromInput?: string, toInput?: string) {
    const to = toInput ? new Date(toInput) : new Date();
    const from = fromInput
      ? new Date(fromInput)
      : new Date(to.getTime() - DEFAULT_RANGE_MS);
    if (
      Number.isNaN(from.getTime()) ||
      Number.isNaN(to.getTime()) ||
      from >= to
    ) {
      throw new BadRequestException("Khoảng thời gian không hợp lệ.");
    }
    if (to.getTime() - from.getTime() > MAX_RANGE_MS) {
      throw new BadRequestException(
        "Khoảng thời gian quá lớn. Vui lòng chọn phạm vi tối đa 30 ngày.",
      );
    }
    return { from, to };
  }

  private buildWhere(
    query: ListStuAccessLogsQueryDto,
    period: { from: Date; to: Date },
  ): Prisma.LinkAccessLogWhereInput {
    const conditions: Prisma.LinkAccessLogWhereInput[] = [];
    if (query.state === "normal") {
      conditions.push({ detectionMask: 0, rejectReasonMask: 0 });
    } else if (query.state === "rejected") {
      conditions.push({ rejectReasonMask: { gt: 0 } });
    } else if (query.state === "suspicious") {
      conditions.push({ detectionMask: { gt: 0 } });
    }
    if (query.reviewStatus === "unreviewed") {
      conditions.push({ review: null });
    } else if (query.reviewStatus) {
      conditions.push({ review: { is: { status: query.reviewStatus } } });
    }
    return {
      createdAt: { gte: period.from, lte: period.to },
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.user?.trim()
        ? {
            user: {
              OR: [
                { name: { contains: query.user.trim() } },
                { email: { contains: query.user.trim() } },
              ],
            },
          }
        : {}),
      ...(query.linkId ? { linkId: query.linkId } : {}),
      ...(query.link?.trim()
        ? {
            link: {
              OR: [
                { title: { contains: query.link.trim() } },
                { slug: { contains: query.link.trim() } },
              ],
            },
          }
        : {}),
      ...(query.ip?.trim()
        ? { ipAddress: { contains: query.ip.trim() } }
        : {}),
      ...(query.country?.trim()
        ? { country: query.country.trim().toUpperCase() }
        : {}),
      ...(query.device ? { device: query.device } : {}),
      ...(query.isEarn !== undefined ? { isEarn: query.isEarn } : {}),
      ...(query.hasRevenue === true
        ? { revenue: { gt: 0 } }
        : query.hasRevenue === false
          ? { revenue: 0 }
          : {}),
      ...(query.detectionMask !== undefined
        ? { detectionMask: query.detectionMask }
        : {}),
      ...(query.rejectReasonMask !== undefined
        ? { rejectReasonMask: query.rejectReasonMask }
        : {}),
      ...(conditions.length ? { AND: conditions } : {}),
    };
  }

  private async relatedStats(record: {
    ipAddress: string | null;
    agentHash: string;
    createdAt: Date;
  }) {
    const to = record.createdAt;
    const from1h = new Date(to.getTime() - 60 * 60 * 1_000);
    const from24h = new Date(to.getTime() - 24 * 60 * 60 * 1_000);
    const period24h = { gte: from24h, lte: to };
    const [sameAgent24h, sameIp1h, sameIp24h, owners, links, revenue] =
      await Promise.all([
        this.prisma.linkAccessLog.count({
          where: { agentHash: record.agentHash, createdAt: period24h },
        }),
        record.ipAddress
          ? this.prisma.linkAccessLog.count({
              where: {
                ipAddress: record.ipAddress,
                createdAt: { gte: from1h, lte: to },
              },
            })
          : 0,
        record.ipAddress
          ? this.prisma.linkAccessLog.count({
              where: { ipAddress: record.ipAddress, createdAt: period24h },
            })
          : 0,
        record.ipAddress
          ? this.prisma.linkAccessLog.findMany({
              where: { ipAddress: record.ipAddress, createdAt: period24h },
              distinct: ["userId"],
              select: { userId: true },
            })
          : [],
        record.ipAddress
          ? this.prisma.linkAccessLog.findMany({
              where: { ipAddress: record.ipAddress, createdAt: period24h },
              distinct: ["linkId"],
              select: {
                link: { select: { id: true, title: true, slug: true } },
              },
              take: 50,
            })
          : [],
        record.ipAddress
          ? this.prisma.linkAccessLog.aggregate({
              where: {
                ipAddress: record.ipAddress,
                createdAt: period24h,
                isEarn: true,
              },
              _sum: { revenue: true },
            })
          : null,
      ]);
    return {
      sameIp1h,
      sameIp24h,
      distinctLinkOwnerCount: owners.length,
      sameAgent24h,
      links: links.map((item) => item.link),
      ipRevenue24h: revenue?._sum.revenue?.toString() ?? "0",
      period: { from: from24h, to },
    };
  }

  private toListItem(record: ListRecord, canViewSensitive: boolean) {
    return {
      id: record.id,
      userId: record.userId,
      linkId: record.linkId,
      user: record.user,
      link: record.link,
      ipAddress: this.presentIp(record.ipAddress, canViewSensitive),
      ipMasked: Boolean(record.ipAddress && !canViewSensitive),
      country: record.country,
      device: record.device,
      deviceLabel: this.deviceLabel(record.device),
      revenue: record.revenue.toString(),
      isEarn: record.isEarn,
      detectionMask: record.detectionMask,
      detectionReasons: this.decodeDetectionMask(record.detectionMask),
      rejectReasonMask: record.rejectReasonMask,
      rejectReasons: this.decodeRejectMask(record.rejectReasonMask),
      detectionStatus: this.detectionStatus(record),
      riskScore: null,
      review: record.review,
      completedAt: record.completedAt,
      processedAt: record.processedAt,
      createdAt: record.createdAt,
    };
  }

  private detectionStatus(record: {
    detectionMask: number;
    rejectReasonMask: number;
  }) {
    if (record.rejectReasonMask > 0) return "rejected";
    if (record.detectionMask > 0) return "suspicious";
    return "normal";
  }

  private decodeDetectionMask(mask: number) {
    if (!mask) return [];
    return this.decodeUnknownBits(mask, "Detection bit");
  }

  private decodeRejectMask(mask: number) {
    const reasons: string[] = [];
    if (mask & 1) reasons.push("Vượt giới hạn doanh thu ngày");
    if (mask & 2) reasons.push("Thiếu địa chỉ IP");
    const known = mask & ~3;
    return [...reasons, ...this.decodeUnknownBits(known, "Reject bit")];
  }

  private decodeUnknownBits(mask: number, prefix: string) {
    const values: string[] = [];
    for (let bit = 1; bit > 0 && bit <= mask; bit *= 2) {
      if (mask & bit) values.push(`${prefix} ${bit}`);
    }
    return values;
  }

  private deviceLabel(device: number) {
    const resolved = DEVICE_TYPE_NAMES[device];
    if (!resolved || resolved === "unknown") return "Unknown";
    return resolved[0].toUpperCase() + resolved.slice(1);
  }

  presentIp(value: string | null, canViewSensitive: boolean) {
    if (!value) return null;
    if (canViewSensitive) return value;
    if (value.includes(".")) {
      const parts = value.split(".");
      return `${parts.slice(0, 2).join(".")}.xxx.xxx`;
    }
    const parts = value.split(":").filter(Boolean);
    return `${parts.slice(0, 2).join(":")}:xxxx:xxxx`;
  }

  private async assertExists(id: string) {
    const record = await this.prisma.linkAccessLog.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!record) throw new NotFoundException("Access log không tồn tại.");
  }

  private toNumber(value: bigint | number | null | undefined) {
    return Number(value ?? 0);
  }
}
