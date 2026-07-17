import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import type {
  AdminLinkFilterDto,
  ListAdminLinksQueryDto,
} from "./dto/list-admin-links-query.dto";
import type { BulkUpdateAdminLinksStatusDto } from "./dto/bulk-admin-links.dto";
import type { UpdateAdminLinkDto } from "./dto/update-admin-link.dto";

const adminLinkInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
    },
  },
  actions: {
    select: {
      id: true,
      platform: true,
      action: true,
      url: true,
      position: true,
    },
    orderBy: { position: "asc" as const },
  },
  destinationFile: {
    select: { id: true, alias: true, name: true },
  },
  destinationSnippet: {
    select: { id: true, name: true },
  },
} satisfies Prisma.LinkInclude;

type AdminLinkRecord = Prisma.LinkGetPayload<{
  include: typeof adminLinkInclude;
}>;

@Injectable()
export class AdminLinksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListAdminLinksQueryDto) {
    const appliedSort = query.sort?.length
      ? query.sort
      : [{ id: "createdAt" as const, desc: true }];
    const orderBy = appliedSort.map(
      (sort) =>
        ({
          [sort.id]: sort.desc ? "desc" : "asc",
        }) satisfies Prisma.LinkOrderByWithRelationInput,
    );
    const standardWhere = this.buildStandardWhere(query);
    const advancedWhere = this.buildAdvancedWhere(
      query.filters ?? [],
      query.joinOperator,
    );
    const where: Prisma.LinkWhereInput = advancedWhere
      ? { AND: [standardWhere, advancedWhere] }
      : standardWhere;
    const skip = (query.page - 1) * query.perPage;

    const [items, total, aggregate] = await this.prisma.$transaction([
      this.prisma.link.findMany({
        where,
        skip,
        take: query.perPage,
        orderBy,
        include: adminLinkInclude,
      }),
      this.prisma.link.count({ where }),
      this.prisma.link.aggregate({
        where,
        _sum: { clicks: true },
      }),
    ]);

    return {
      items: items.map((link) => this.toResponse(link)),
      page: query.page,
      limit: query.perPage,
      perPage: query.perPage,
      total,
      pageCount: Math.max(1, Math.ceil(total / query.perPage)),
      totalClicks: aggregate._sum.clicks ?? 0,
    };
  }

  async findOne(id: number) {
    return this.toResponse(await this.findRecord(id));
  }

  async update(id: number, dto: UpdateAdminLinkDto) {
    const existing = await this.findRecord(id);
    if (existing.deletedAt) {
      throw new BadRequestException(
        "Hãy khôi phục social link trước khi chỉnh sửa.",
      );
    }
    if (dto.destinationUrl && existing.destinationType !== "url") {
      throw new BadRequestException(
        "Chỉ social link loại URL mới được đổi destination URL tại đây.",
      );
    }
    const title = dto.title?.trim();
    if (dto.title !== undefined && !title) {
      throw new BadRequestException("Tiêu đề không được để trống.");
    }

    const updated = await this.prisma.link.update({
      where: { id },
      data: {
        ...(title ? { title } : {}),
        ...(dto.subtitle !== undefined
          ? { subtitle: this.emptyToNull(dto.subtitle) }
          : {}),
        ...(dto.destinationUrl
          ? { destinationUrl: dto.destinationUrl.trim() }
          : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
      include: adminLinkInclude,
    });

    return this.toResponse(updated);
  }

  async updateManyStatuses(dto: BulkUpdateAdminLinksStatusDto) {
    const ids = this.uniqueIds(dto.ids);
    const result = await this.prisma.link.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { status: dto.status },
    });
    return { updated: result.count };
  }

  async remove(id: number) {
    await this.findRecord(id);
    return this.removeMany([id]);
  }

  async removeMany(inputIds: number[]) {
    const ids = this.uniqueIds(inputIds);
    const result = await this.prisma.link.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date(), status: "inactive" },
    });
    return { deleted: result.count };
  }

  async restore(id: number) {
    await this.findRecord(id);
    const result = await this.restoreMany([id]);
    return { id, ...result };
  }

  async restoreMany(inputIds: number[]) {
    const ids = this.uniqueIds(inputIds);
    const result = await this.prisma.link.updateMany({
      where: { id: { in: ids }, deletedAt: { not: null } },
      data: { deletedAt: null, status: "inactive" },
    });
    return { restored: result.count };
  }

  private buildStandardWhere(
    query: ListAdminLinksQueryDto,
  ): Prisma.LinkWhereInput {
    const title = query.title?.trim();
    const owner = query.owner?.trim();
    const deletion = query.filters?.some(
      (filter) => filter.id === "deletedState",
    )
      ? undefined
      : this.buildDeletionStateCondition(query.deletedState);

    return {
      ...(deletion ?? {}),
      ...(query.status?.length ? { status: { in: query.status } } : {}),
      ...(query.destinationType?.length
        ? { destinationType: { in: query.destinationType } }
        : {}),
      ...(title
        ? {
            OR: [
              { title: { contains: title } },
              { slug: { contains: title } },
            ],
          }
        : {}),
      ...(owner
        ? {
            user: {
              OR: [
                { name: { contains: owner } },
                { email: { contains: owner } },
              ],
            },
          }
        : {}),
    };
  }

  private buildAdvancedWhere(
    filters: AdminLinkFilterDto[],
    joinOperator: "and" | "or",
  ): Prisma.LinkWhereInput | undefined {
    const conditions = filters
      .map((filter) => this.buildFilterCondition(filter))
      .filter(
        (condition): condition is Prisma.LinkWhereInput => Boolean(condition),
      );

    if (!conditions.length) return undefined;
    return joinOperator === "or" ? { OR: conditions } : { AND: conditions };
  }

  private buildFilterCondition(
    filter: AdminLinkFilterDto,
  ): Prisma.LinkWhereInput | undefined {
    if (filter.id === "createdAt") return this.buildDateFilter(filter);
    if (filter.id === "owner") return this.buildOwnerFilter(filter);
    if (filter.id === "title") return this.buildTitleFilter(filter);
    if (filter.id === "deletedState") {
      const values = Array.isArray(filter.value)
        ? filter.value
        : [filter.value];
      return this.buildDeletionStateCondition(
        values.filter(
          (value): value is "active" | "deleted" =>
            value === "active" || value === "deleted",
        ),
      );
    }

    const value =
      typeof filter.value === "string" ? filter.value : undefined;
    const values = Array.isArray(filter.value) ? filter.value : undefined;
    const field = filter.id;

    if (field === "clicks") {
      const number = value === undefined ? null : Number(value);
      if (number === null || !Number.isFinite(number)) return undefined;
      const operatorMap = {
        eq: "equals",
        ne: "not",
        lt: "lt",
        lte: "lte",
        gt: "gt",
        gte: "gte",
      } as const;
      const operator = operatorMap[
        filter.operator as keyof typeof operatorMap
      ];
      return operator
        ? { clicks: { [operator]: number } }
        : undefined;
    }

    switch (filter.operator) {
      case "iLike":
        return value
          ? ({ [field]: { contains: value } } as Prisma.LinkWhereInput)
          : undefined;
      case "notILike":
        return value
          ? ({
              NOT: { [field]: { contains: value } },
            } as Prisma.LinkWhereInput)
          : undefined;
      case "eq":
        return value !== undefined
          ? ({ [field]: { equals: value } } as Prisma.LinkWhereInput)
          : undefined;
      case "ne":
        return value !== undefined
          ? ({
              NOT: { [field]: { equals: value } },
            } as Prisma.LinkWhereInput)
          : undefined;
      case "inArray":
        return values?.length
          ? ({ [field]: { in: values } } as Prisma.LinkWhereInput)
          : undefined;
      case "notInArray":
        return values?.length
          ? ({
              [field]: { notIn: values },
            } as Prisma.LinkWhereInput)
          : undefined;
      case "isEmpty":
        return { [field]: { equals: "" } } as Prisma.LinkWhereInput;
      case "isNotEmpty":
        return { [field]: { not: "" } } as Prisma.LinkWhereInput;
      default:
        return undefined;
    }
  }

  private buildOwnerFilter(
    filter: AdminLinkFilterDto,
  ): Prisma.LinkWhereInput | undefined {
    const value =
      typeof filter.value === "string" ? filter.value : undefined;
    if (!value) return undefined;

    if (filter.operator === "iLike") {
      return {
        user: {
          OR: [
            { name: { contains: value } },
            { email: { contains: value } },
          ],
        },
      };
    }
    if (filter.operator === "notILike") {
      return {
        NOT: {
          user: {
            OR: [
              { name: { contains: value } },
              { email: { contains: value } },
            ],
          },
        },
      };
    }
    return undefined;
  }

  private buildTitleFilter(
    filter: AdminLinkFilterDto,
  ): Prisma.LinkWhereInput | undefined {
    const value =
      typeof filter.value === "string" ? filter.value : undefined;
    if (!value) return undefined;

    if (filter.operator === "iLike") {
      return {
        OR: [
          { title: { contains: value } },
          { slug: { contains: value } },
        ],
      };
    }
    if (filter.operator === "notILike") {
      return {
        NOT: {
          OR: [
            { title: { contains: value } },
            { slug: { contains: value } },
          ],
        },
      };
    }
    if (filter.operator === "eq" || filter.operator === "ne") {
      const condition: Prisma.LinkWhereInput = {
        OR: [{ title: { equals: value } }, { slug: { equals: value } }],
      };
      return filter.operator === "ne" ? { NOT: condition } : condition;
    }
    return undefined;
  }

  private buildDeletionStateCondition(
    values: Array<"active" | "deleted">,
  ): Prisma.LinkWhereInput | undefined {
    if (values.includes("active") && values.includes("deleted")) {
      return undefined;
    }
    if (values.includes("deleted")) {
      return { deletedAt: { not: null } };
    }
    return { deletedAt: null };
  }

  private buildDateFilter(
    filter: AdminLinkFilterDto,
  ): Prisma.LinkWhereInput | undefined {
    const value =
      typeof filter.value === "string" ? filter.value : undefined;
    const values = Array.isArray(filter.value) ? filter.value : undefined;
    const date = value ? this.parseDate(value) : null;

    switch (filter.operator) {
      case "eq":
        return date
          ? {
              createdAt: {
                gte: this.startOfDay(date),
                lte: this.endOfDay(date),
              },
            }
          : undefined;
      case "ne":
        return date
          ? {
              OR: [
                { createdAt: { lt: this.startOfDay(date) } },
                { createdAt: { gt: this.endOfDay(date) } },
              ],
            }
          : undefined;
      case "lt":
        return date ? { createdAt: { lt: this.endOfDay(date) } } : undefined;
      case "lte":
        return date ? { createdAt: { lte: this.endOfDay(date) } } : undefined;
      case "gt":
        return date
          ? { createdAt: { gt: this.startOfDay(date) } }
          : undefined;
      case "gte":
        return date
          ? { createdAt: { gte: this.startOfDay(date) } }
          : undefined;
      case "isBetween": {
        if (!values || values.length !== 2) return undefined;
        const start = values[0] ? this.parseDate(values[0]) : null;
        const end = values[1] ? this.parseDate(values[1]) : null;
        if (!start && !end) return undefined;
        return {
          createdAt: {
            ...(start ? { gte: this.startOfDay(start) } : {}),
            ...(end ? { lte: this.endOfDay(end) } : {}),
          },
        };
      }
      case "isRelativeToToday": {
        if (!value) return undefined;
        const [amountValue, unit] = value.split(" ");
        const amount = Number.parseInt(amountValue || "", 10);
        if (!Number.isFinite(amount)) return undefined;
        const days =
          unit === "weeks"
            ? amount * 7
            : unit === "months"
              ? amount * 30
              : unit === "days"
                ? amount
                : null;
        if (days === null) return undefined;
        const start = new Date();
        start.setDate(start.getDate() + days);
        const span = unit === "weeks" ? 6 : unit === "months" ? 29 : 0;
        const end = new Date(start);
        end.setDate(end.getDate() + span);
        return {
          createdAt: {
            gte: this.startOfDay(start),
            lte: this.endOfDay(end),
          },
        };
      }
      default:
        return undefined;
    }
  }

  private async findRecord(id: number) {
    const link = await this.prisma.link.findUnique({
      where: { id },
      include: adminLinkInclude,
    });
    if (!link) throw new NotFoundException("Không tìm thấy social link.");
    return link;
  }

  private uniqueIds(ids: number[]) {
    return [...new Set(ids)];
  }

  private parseDate(value: string) {
    const numeric = Number(value);
    const date = new Date(Number.isFinite(numeric) ? numeric : value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private startOfDay(value: Date) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private endOfDay(value: Date) {
    const date = new Date(value);
    date.setHours(23, 59, 59, 999);
    return date;
  }

  private emptyToNull(value?: string | null) {
    if (!value) return null;
    const trimmed = value.trim();
    return trimmed || null;
  }

  private toResponse(link: AdminLinkRecord) {
    return {
      id: link.id,
      slug: link.slug,
      title: link.title,
      subtitle: link.subtitle,
      status: link.status,
      destinationType: link.destinationType,
      destinationUrl: link.destinationUrl,
      destinationFile: link.destinationFile,
      destinationSnippet: link.destinationSnippet,
      clicks: link.clicks,
      revenue: link.revenue.toString(),
      actionsCount: link.actions.length,
      platforms: [...new Set(link.actions.map((action) => action.platform))],
      actions: link.actions,
      expiresAt: link.expiresAt,
      maxClicks: link.maxClicks,
      owner: link.user,
      deletedAt: link.deletedAt,
      deletedState: link.deletedAt ? "deleted" : "active",
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
    };
  }
}
