import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";

import { PrismaService } from "../../database/prisma/prisma.service";
import type {
  QueryLinkReportsDto,
  UpdateLinkReportDto,
} from "./dto/admin-link-report.dto";
import type { CreateLinkReportDto } from "./dto/create-link-report.dto";
import type { LinkReportStatus } from "./link-report.constants";

const reviewerSelect = {
  id: true,
  name: true,
  email: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class LinkReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLinkReportDto) {
    const reportedUrl = this.normalizeUrl(dto.reportedUrl);
    const duplicateSince = new Date(Date.now() - 10 * 60_000);
    const duplicate = await this.prisma.linkReport.findFirst({
      where: {
        email: dto.email,
        reportedUrl,
        status: "pending",
        createdAt: { gte: duplicateSince },
      },
      orderBy: { createdAt: "desc" },
      select: { reference: true, createdAt: true },
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
      select: { reference: true, createdAt: true },
    });
  }

  async findAllForAdmin(query: QueryLinkReportsDto) {
    const where: Prisma.LinkReportWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.reason ? { reason: query.reason } : {}),
      ...(query.search
        ? {
            OR: [
              { reference: { contains: query.search } },
              { email: { contains: query.search } },
              { reportedUrl: { contains: query.search } },
              { details: { contains: query.search } },
            ],
          }
        : {}),
    };
    const skip = (query.page - 1) * query.perPage;
    const [items, total, pending, reviewing, resolved, dismissed] =
      await this.prisma.$transaction([
        this.prisma.linkReport.findMany({
          where,
          skip,
          take: query.perPage,
          orderBy: { [query.sortBy]: query.sortOrder },
          select: {
            id: true,
            reference: true,
            email: true,
            reportedUrl: true,
            reason: true,
            status: true,
            resolutionNote: true,
            resolvedAt: true,
            createdAt: true,
            updatedAt: true,
            reviewedBy: { select: reviewerSelect },
          },
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
    if (dto.status === undefined && dto.resolutionNote === undefined) {
      throw new BadRequestException("Không có thay đổi để lưu.");
    }
    const completed =
      dto.status === "resolved" || dto.status === "dismissed";

    await this.prisma.linkReport.update({
      where: { id },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.resolutionNote !== undefined
          ? { resolutionNote: dto.resolutionNote || null }
          : {}),
        reviewedById: adminId,
        ...(dto.status !== undefined
          ? { resolvedAt: completed ? new Date() : null }
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

  private normalizeUrl(value: string) {
    try {
      const url = new URL(value);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("Unsupported protocol");
      }
      return url.toString();
    } catch {
      throw new BadRequestException("URL cần báo cáo không hợp lệ.");
    }
  }

  private countActiveStatus(status: LinkReportStatus) {
    return this.prisma.linkReport.count({
      where: { status, deletedAt: null },
    });
  }

  private async findAdminRecord(id: number) {
    const report = await this.prisma.linkReport.findFirst({
      where: { id, deletedAt: null },
      include: { reviewedBy: { select: reviewerSelect } },
    });
    if (!report) throw new NotFoundException("Không tìm thấy báo cáo.");
    return report;
  }
}
