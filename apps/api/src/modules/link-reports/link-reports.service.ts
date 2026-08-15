import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";

import { PrismaService } from "../../database/prisma/prisma.service";
import type {
  QueryLinkReportsDto,
  UpdateLinkReportDto,
} from "./dto/admin-link-report.dto";
import type { CreateLinkReportDto } from "./dto/create-link-report.dto";
import type { LinkReportStatus } from "./link-report.constants";
import { normalizeReportedUrl } from "./link-reports.normalizer";
import {
  assertLinkReportHasChanges,
  resolvedAtForStatus,
} from "./link-reports.policy";
import { buildLinkReportsListQuery } from "./queries/link-reports-list-query.builder";
import {
  LINK_REPORT_ADMIN_INCLUDE,
  LINK_REPORT_LIST_SELECT,
  LINK_REPORT_RECEIPT_SELECT,
} from "./link-reports.select";

@Injectable()
export class LinkReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLinkReportDto) {
    const reportedUrl = normalizeReportedUrl(dto.reportedUrl);
    const duplicateSince = new Date(Date.now() - 10 * 60_000);
    const duplicate = await this.prisma.linkReport.findFirst({
      where: {
        email: dto.email,
        reportedUrl,
        status: "pending",
        createdAt: { gte: duplicateSince },
      },
      orderBy: { createdAt: "desc" },
      select: LINK_REPORT_RECEIPT_SELECT,
    });
    if (duplicate) return duplicate;

    return this.prisma.linkReport.create({
      data: {
        reference: `RPT-${new Date().getUTCFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`,
        email: dto.email,
        reportedUrl,
        reason: dto.reason,
        details: dto.details,
      },
      select: LINK_REPORT_RECEIPT_SELECT,
    });
  }

  async findAllForAdmin(query: QueryLinkReportsDto) {
    const { where, orderBy, skip, take } = buildLinkReportsListQuery(query);
    const [items, total, pending, reviewing, resolved, dismissed] =
      await this.prisma.$transaction([
        this.prisma.linkReport.findMany({
          where,
          skip,
          take,
          orderBy,
          select: LINK_REPORT_LIST_SELECT,
        }),
        this.prisma.linkReport.count({ where }),
        this.countActiveStatus("pending"),
        this.countActiveStatus("reviewing"),
        this.countActiveStatus("resolved"),
        this.countActiveStatus("dismissed"),
      ]);

    return {
      items,
      pagination: {
        page: query.page,
        perPage: query.perPage,
        total,
        pageCount: Math.max(1, Math.ceil(total / query.perPage)),
      },
      summary: { pending, reviewing, resolved, dismissed },
    };
  }

  async findOneForAdmin(id: number) {
    return this.findAdminRecord(id);
  }

  async updateForAdmin(
    id: number,
    adminId: number,
    dto: UpdateLinkReportDto,
  ) {
    await this.findAdminRecord(id);
    assertLinkReportHasChanges(dto);

    await this.prisma.linkReport.update({
      where: { id },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.resolutionNote !== undefined
          ? { resolutionNote: dto.resolutionNote || null }
          : {}),
        reviewedById: adminId,
        ...(dto.status !== undefined
          ? { resolvedAt: resolvedAtForStatus(dto.status) }
          : {}),
      },
    });
    return this.findAdminRecord(id);
  }

  async deleteForAdmin(id: number, adminId: number) {
    await this.findAdminRecord(id);
    await this.prisma.linkReport.update({
      where: { id },
      data: { deletedAt: new Date(), reviewedById: adminId },
    });
    return { deleted: 1 };
  }

  private countActiveStatus(status: LinkReportStatus) {
    return this.prisma.linkReport.count({
      where: { status, deletedAt: null },
    });
  }

  private async findAdminRecord(id: number) {
    const report = await this.prisma.linkReport.findFirst({
      where: { id, deletedAt: null },
      include: LINK_REPORT_ADMIN_INCLUDE,
    });
    if (!report) throw new NotFoundException("Không tìm thấy báo cáo.");
    return report;
  }
}
