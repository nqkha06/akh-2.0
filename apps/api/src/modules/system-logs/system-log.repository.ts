import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";
import type { ListSystemLogsQueryDto } from "./dto/list-system-logs-query.dto";
import { buildSystemLogsListQuery } from "./queries/system-logs-list-query.builder";
import type { NormalizedSystemLogInput } from "./system-log.types";

const actorSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
} satisfies Prisma.UserSelect;

const listSelect = {
  id: true,
  level: true,
  category: true,
  context: true,
  event: true,
  message: true,
  userId: true,
  adminId: true,
  requestId: true,
  ipAddress: true,
  createdAt: true,
  user: { select: actorSelect },
  admin: { select: actorSelect },
} satisfies Prisma.SystemLogSelect;

const detailSelect = {
  ...listSelect,
  metadata: true,
  userAgent: true,
  stack: true,
} satisfies Prisma.SystemLogSelect;

@Injectable()
export class SystemLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: NormalizedSystemLogInput) {
    return this.prisma.systemLog.create({
      data: {
        level: input.level,
        category: input.category,
        context: input.context,
        event: input.event,
        message: input.message,
        metadata: input.metadata,
        userId: input.userId,
        adminId: input.adminId,
        requestId: input.requestId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        stack: input.stack,
        createdAt: input.createdAt,
      },
      select: { id: true, createdAt: true },
    });
  }

  async findAll(query: ListSystemLogsQueryDto) {
    const listQuery = buildSystemLogsListQuery(query);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.systemLog.findMany({ ...listQuery, select: listSelect }),
      this.prisma.systemLog.count({ where: listQuery.where }),
    ]);
    return {
      items,
      total,
      page: query.page,
      perPage: query.perPage,
      pageCount: Math.max(1, Math.ceil(total / query.perPage)),
    };
  }

  findOne(id: string) {
    return this.prisma.systemLog.findUnique({
      where: { id },
      select: detailSelect,
    });
  }

  async stats() {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1_000);
    const period = { createdAt: { gte: since } };
    const [total, errors, warnings, security] = await Promise.all([
      this.prisma.systemLog.count({ where: period }),
      this.prisma.systemLog.count({ where: { ...period, level: "error" } }),
      this.prisma.systemLog.count({ where: { ...period, level: "warn" } }),
      this.prisma.systemLog.count({
        where: { ...period, category: "SECURITY" },
      }),
    ]);
    return { since, total, errors, warnings, security };
  }

  deleteOne(id: string) {
    return this.prisma.systemLog.deleteMany({ where: { id } });
  }

  deleteMany(ids: string[]) {
    return this.prisma.systemLog.deleteMany({ where: { id: { in: ids } } });
  }

  count(where: Prisma.SystemLogWhereInput) {
    return this.prisma.systemLog.count({ where });
  }

  deleteWhere(where: Prisma.SystemLogWhereInput) {
    return this.prisma.systemLog.deleteMany({ where });
  }

  async deleteWhereInBatches(
    where: Prisma.SystemLogWhereInput,
    batchSize = 5_000,
  ) {
    let count = 0;
    for (;;) {
      const rows = await this.prisma.systemLog.findMany({
        where,
        orderBy: { createdAt: "asc" },
        take: batchSize,
        select: { id: true },
      });
      if (!rows.length) break;
      const result = await this.prisma.systemLog.deleteMany({
        where: { id: { in: rows.map((row) => row.id) } },
      });
      count += result.count;
      if (rows.length < batchSize) break;
    }
    return { count };
  }
}
