import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import sanitizeHtml from "sanitize-html";

import { PrismaService } from "../../database/prisma/prisma.service";
import type { AuthenticatedUser } from "../auth/auth.types";
import type {
  BulkUpdatePagesStatusDto,
} from "./dto/bulk-pages.dto";
import type { CreatePageDto } from "./dto/create-page.dto";
import type { PageFilterDto, QueryPagesDto } from "./dto/query-pages.dto";
import type { UpdatePageStatusDto } from "./dto/update-page-status.dto";
import type { UpdatePageDto } from "./dto/update-page.dto";
import type { PageStatus } from "./pages.constants";

const featuredImageSelect = {
  id: true,
  alias: true,
  name: true,
  mimeType: true,
  extension: true,
} satisfies Prisma.ManagedFileSelect;

const pageInclude = {
  featuredImage: { select: featuredImageSelect },
} satisfies Prisma.PageInclude;

type PageRecord = Prisma.PageGetPayload<{ include: typeof pageInclude }>;

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryPagesDto) {
    const appliedSort = query.sort?.length
      ? query.sort
      : [{ id: "updatedAt" as const, desc: true }];
    const orderBy = appliedSort.map(
      (sort) =>
        ({
          [sort.id]: sort.desc ? "desc" : "asc",
        }) as Prisma.PageOrderByWithRelationInput,
    );
    const standardWhere = this.buildStandardWhere(query);
    const advancedWhere = this.buildAdvancedWhere(
      query.filters ?? [],
      query.joinOperator,
    );
    const where: Prisma.PageWhereInput = advancedWhere
      ? { AND: [standardWhere, advancedWhere] }
      : standardWhere;
    const skip = (query.page - 1) * query.perPage;

    const [records, total] = await this.prisma.$transaction([
      this.prisma.page.findMany({
        where,
        skip,
        take: query.perPage,
        orderBy,
        include: pageInclude,
      }),
      this.prisma.page.count({ where }),
    ]);
    const items = records.map((page) => this.toListResponse(page));
    const pageCount = Math.max(1, Math.ceil(total / query.perPage));

    return {
      items,
      data: items,
      page: query.page,
      limit: query.perPage,
      perPage: query.perPage,
      total,
      pageCount,
      sort: appliedSort,
      filters: {
        search: query.search?.trim() || null,
        status: query.status ?? [],
        advanced: query.filters ?? [],
        joinOperator: query.joinOperator,
      },
    };
  }

  async findOne(id: number) {
    return this.toResponse(await this.findRecord(id));
  }

  async create(dto: CreatePageDto, user: AuthenticatedUser) {
    if (dto.status === "PUBLISHED") this.assertCanPublish(user);
    const slug = this.normalizeSlug(dto.slug || dto.title);
    await this.assertSlugAvailable(slug);
    await this.assertFeaturedImage(dto.featuredImageId);
    const contentJson = this.serializeContent(dto.contentJson);

    try {
      const page = await this.prisma.page.create({
        data: {
          title: dto.title.trim(),
          slug,
          excerpt: this.emptyToNull(dto.excerpt),
          contentJson,
          contentHtml: this.sanitizeContent(dto.contentHtml ?? ""),
          status: dto.status,
          featuredImageId: dto.featuredImageId || null,
          seoTitle: this.emptyToNull(dto.seoTitle),
          seoDescription: this.emptyToNull(dto.seoDescription),
          seoKeywords: this.emptyToNull(dto.seoKeywords),
          canonicalUrl: this.emptyToNull(dto.canonicalUrl),
          robotsIndex: dto.robotsIndex,
          robotsFollow: dto.robotsFollow,
          sortOrder: dto.sortOrder,
          publishedAt: dto.status === "PUBLISHED" ? new Date() : null,
        },
        include: pageInclude,
      });
      return this.toResponse(page);
    } catch (error) {
      this.rethrowKnownError(error);
      throw error;
    }
  }

  async update(id: number, dto: UpdatePageDto) {
    const current = await this.findRecord(id);
    if (current.status === "ARCHIVED") {
      throw new BadRequestException(
        "Hãy khôi phục trang về nháp trước khi chỉnh sửa.",
      );
    }
    const slug =
      dto.slug === undefined ? undefined : this.normalizeSlug(dto.slug);
    if (slug && slug !== current.slug) {
      await this.assertSlugAvailable(slug, id);
    }
    await this.assertFeaturedImage(dto.featuredImageId);
    if (dto.contentJson !== undefined && dto.contentHtml === undefined) {
      throw new BadRequestException(
        "contentHtml là bắt buộc khi cập nhật contentJson.",
      );
    }

    try {
      const page = await this.prisma.page.update({
        where: { id },
        data: {
          ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
          ...(slug !== undefined ? { slug } : {}),
          ...(dto.excerpt !== undefined
            ? { excerpt: this.emptyToNull(dto.excerpt) }
            : {}),
          ...(dto.contentJson !== undefined
            ? { contentJson: this.serializeContent(dto.contentJson) }
            : {}),
          ...(dto.contentHtml !== undefined
            ? { contentHtml: this.sanitizeContent(dto.contentHtml) }
            : {}),
          ...(dto.featuredImageId !== undefined
            ? { featuredImageId: dto.featuredImageId || null }
            : {}),
          ...(dto.seoTitle !== undefined
            ? { seoTitle: this.emptyToNull(dto.seoTitle) }
            : {}),
          ...(dto.seoDescription !== undefined
            ? { seoDescription: this.emptyToNull(dto.seoDescription) }
            : {}),
          ...(dto.seoKeywords !== undefined
            ? { seoKeywords: this.emptyToNull(dto.seoKeywords) }
            : {}),
          ...(dto.canonicalUrl !== undefined
            ? { canonicalUrl: this.emptyToNull(dto.canonicalUrl) }
            : {}),
          ...(dto.robotsIndex !== undefined
            ? { robotsIndex: dto.robotsIndex }
            : {}),
          ...(dto.robotsFollow !== undefined
            ? { robotsFollow: dto.robotsFollow }
            : {}),
          ...(dto.sortOrder !== undefined
            ? { sortOrder: dto.sortOrder }
            : {}),
        },
        include: pageInclude,
      });
      return this.toResponse(page);
    } catch (error) {
      this.rethrowKnownError(error);
      throw error;
    }
  }

  async updateStatus(
    id: number,
    dto: UpdatePageStatusDto,
    user: AuthenticatedUser,
  ) {
    const current = await this.findRecord(id);
    this.assertStatusTransition(current.status as PageStatus, dto.status);
    if (dto.status === "PUBLISHED") this.assertCanPublish(user);
    await this.applyStatus([id], dto.status);
    return this.findOne(id);
  }

  async updateManyStatuses(
    dto: BulkUpdatePagesStatusDto,
    user: AuthenticatedUser,
  ) {
    const ids = this.uniqueIds(dto.ids);
    if (dto.status === "PUBLISHED") this.assertCanPublish(user);
    const records = await this.prisma.page.findMany({
      where: { id: { in: ids }, deletedAt: null },
      select: { id: true, status: true },
    });
    if (records.length !== ids.length) {
      throw new NotFoundException("Một hoặc nhiều trang không tồn tại.");
    }
    for (const record of records) {
      this.assertStatusTransition(record.status as PageStatus, dto.status);
    }
    const updated = await this.applyStatus(ids, dto.status);
    return { updated };
  }

  async remove(id: number) {
    await this.findRecord(id);
    const result = await this.removeMany([id]);
    return { id, ...result };
  }

  async removeMany(inputIds: number[]) {
    const ids = this.uniqueIds(inputIds);
    const result = await this.prisma.page.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return { deleted: result.count };
  }

  private async applyStatus(ids: number[], status: PageStatus) {
    return this.prisma.$transaction(async (prisma) => {
      if (status === "PUBLISHED") {
        await prisma.page.updateMany({
          where: {
            id: { in: ids },
            deletedAt: null,
            publishedAt: null,
          },
          data: { publishedAt: new Date() },
        });
      }
      const result = await prisma.page.updateMany({
        where: { id: { in: ids }, deletedAt: null },
        data: { status },
      });
      return result.count;
    });
  }

  private buildStandardWhere(query: QueryPagesDto): Prisma.PageWhereInput {
    const search = query.search?.trim();
    return {
      deletedAt: null,
      ...(query.status?.length ? { status: { in: query.status } } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search } },
              { slug: { contains: search } },
            ],
          }
        : {}),
    };
  }

  private buildAdvancedWhere(
    filters: PageFilterDto[],
    joinOperator: "and" | "or",
  ): Prisma.PageWhereInput | undefined {
    const conditions = filters
      .map((filter) => this.buildFilterCondition(filter))
      .filter(
        (condition): condition is Prisma.PageWhereInput => Boolean(condition),
      );
    if (!conditions.length) return undefined;
    return joinOperator === "or" ? { OR: conditions } : { AND: conditions };
  }

  private buildFilterCondition(
    filter: PageFilterDto,
  ): Prisma.PageWhereInput | undefined {
    if (
      filter.id === "createdAt" ||
      filter.id === "updatedAt" ||
      filter.id === "publishedAt"
    ) {
      return this.buildDateFilter(filter);
    }

    const value =
      typeof filter.value === "string" ? filter.value : undefined;
    const values = Array.isArray(filter.value) ? filter.value : undefined;
    const field = filter.id;

    switch (filter.operator) {
      case "iLike":
        return value
          ? ({ [field]: { contains: value } } as Prisma.PageWhereInput)
          : undefined;
      case "notILike":
        return value
          ? ({
              NOT: { [field]: { contains: value } },
            } as Prisma.PageWhereInput)
          : undefined;
      case "eq":
        return value !== undefined
          ? ({ [field]: { equals: value } } as Prisma.PageWhereInput)
          : undefined;
      case "ne":
        return value !== undefined
          ? ({
              NOT: { [field]: { equals: value } },
            } as Prisma.PageWhereInput)
          : undefined;
      case "inArray":
        return values?.length
          ? ({ [field]: { in: values } } as Prisma.PageWhereInput)
          : undefined;
      case "notInArray":
        return values?.length
          ? ({ [field]: { notIn: values } } as Prisma.PageWhereInput)
          : undefined;
      case "isEmpty":
        return { [field]: { equals: "" } } as Prisma.PageWhereInput;
      case "isNotEmpty":
        return { [field]: { not: "" } } as Prisma.PageWhereInput;
      default:
        return undefined;
    }
  }

  private buildDateFilter(
    filter: PageFilterDto,
  ): Prisma.PageWhereInput | undefined {
    const field = filter.id;
    const value =
      typeof filter.value === "string" ? filter.value : undefined;
    const values = Array.isArray(filter.value) ? filter.value : undefined;
    const date = value ? this.parseDate(value) : null;

    if (filter.operator === "isEmpty") {
      return { [field]: null } as Prisma.PageWhereInput;
    }
    if (filter.operator === "isNotEmpty") {
      return { [field]: { not: null } } as Prisma.PageWhereInput;
    }

    let condition: Record<string, Date> | undefined;
    switch (filter.operator) {
      case "eq":
        condition = date
          ? { gte: this.startOfDay(date), lte: this.endOfDay(date) }
          : undefined;
        break;
      case "ne":
        return date
          ? ({
              OR: [
                { [field]: { lt: this.startOfDay(date) } },
                { [field]: { gt: this.endOfDay(date) } },
              ],
            } as Prisma.PageWhereInput)
          : undefined;
      case "lt":
        condition = date ? { lt: this.endOfDay(date) } : undefined;
        break;
      case "lte":
        condition = date ? { lte: this.endOfDay(date) } : undefined;
        break;
      case "gt":
        condition = date ? { gt: this.startOfDay(date) } : undefined;
        break;
      case "gte":
        condition = date ? { gte: this.startOfDay(date) } : undefined;
        break;
      case "isBetween": {
        if (!values || values.length !== 2) return undefined;
        const start = values[0] ? this.parseDate(values[0]) : null;
        const end = values[1] ? this.parseDate(values[1]) : null;
        if (!start && !end) return undefined;
        condition = {
          ...(start ? { gte: this.startOfDay(start) } : {}),
          ...(end ? { lte: this.endOfDay(end) } : {}),
        };
        break;
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
        const end = new Date(start);
        end.setDate(
          end.getDate() + (unit === "weeks" ? 6 : unit === "months" ? 29 : 0),
        );
        condition = {
          gte: this.startOfDay(start),
          lte: this.endOfDay(end),
        };
        break;
      }
      default:
        return undefined;
    }
    return condition
      ? ({ [field]: condition } as Prisma.PageWhereInput)
      : undefined;
  }

  private async findRecord(id: number) {
    const page = await this.prisma.page.findFirst({
      where: { id, deletedAt: null },
      include: pageInclude,
    });
    if (!page) throw new NotFoundException("Không tìm thấy trang.");
    return page;
  }

  private async assertSlugAvailable(slug: string, excludedId?: number) {
    const existing = await this.prisma.page.findFirst({
      where: {
        slug,
        ...(excludedId ? { id: { not: excludedId } } : {}),
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException("Slug đã được sử dụng.");
    }
  }

  private async assertFeaturedImage(id?: string | null) {
    if (id === undefined || id === null || id === "") return;
    const file = await this.prisma.managedFile.findFirst({
      where: { id, deletedAt: null, isPublic: true },
      select: { mimeType: true },
    });
    if (!file || !file.mimeType.toLowerCase().startsWith("image/")) {
      throw new BadRequestException(
        "Featured image phải là ảnh public còn hoạt động trong Media Manager.",
      );
    }
  }

  private assertCanPublish(user: AuthenticatedUser) {
    if (!user.permissions.includes("pages.publish")) {
      throw new ForbiddenException("Bạn không có quyền xuất bản trang.");
    }
  }

  private assertStatusTransition(current: PageStatus, target: PageStatus) {
    if (current === target) return;
    const allowed: Record<PageStatus, PageStatus[]> = {
      DRAFT: ["PUBLISHED", "ARCHIVED"],
      PUBLISHED: ["DRAFT", "ARCHIVED"],
      ARCHIVED: ["DRAFT"],
    };
    if (!allowed[current].includes(target)) {
      throw new BadRequestException(
        `Không thể chuyển trạng thái từ ${current} sang ${target}.`,
      );
    }
  }

  private normalizeSlug(value: string) {
    const slug = value
      .trim()
      .normalize("NFKD")
      .replace(/\p{M}+/gu, "")
      .replace(/[đĐ]/g, (character) => (character === "đ" ? "d" : "D"))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 180);
    if (!slug) {
      throw new BadRequestException("Slug không hợp lệ.");
    }
    return slug;
  }

  private serializeContent(content: Record<string, unknown>) {
    if (content.type !== "doc") {
      throw new BadRequestException("contentJson phải là tài liệu Tiptap.");
    }
    const serialized = JSON.stringify(content);
    if (Buffer.byteLength(serialized, "utf8") > 1_000_000) {
      throw new BadRequestException("Nội dung trang vượt quá 1 MB.");
    }
    return serialized;
  }

  private sanitizeContent(value: string) {
    return sanitizeHtml(value, {
      allowedTags: [
        "p",
        "h1",
        "h2",
        "h3",
        "h4",
        "strong",
        "em",
        "u",
        "s",
        "code",
        "pre",
        "blockquote",
        "ul",
        "ol",
        "li",
        "div",
        "span",
        "label",
        "input",
        "a",
        "img",
        "hr",
        "br",
      ],
      allowedAttributes: {
        a: ["href", "target", "rel"],
        img: ["src", "alt", "title", "width", "height"],
        ul: ["data-type"],
        li: ["data-type", "data-checked"],
        input: ["type", "checked", "disabled"],
        p: ["style"],
        h1: ["style"],
        h2: ["style"],
        h3: ["style"],
        h4: ["style"],
      },
      allowedStyles: {
        "*": {
          "text-align": [/^(left|center|right|justify)$/],
        },
      },
      allowedSchemes: ["http", "https", "mailto"],
      allowedSchemesByTag: {
        img: ["http", "https"],
      },
      allowProtocolRelative: false,
      transformTags: {
        a: sanitizeHtml.simpleTransform("a", {
          rel: "noopener noreferrer",
        }),
        input: (_tagName, attributes) => ({
          tagName: "input",
          attribs: {
            type: "checkbox",
            disabled: "disabled",
            ...(attributes.checked ? { checked: "checked" } : {}),
          },
        }),
      },
    });
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
    return value.trim() || null;
  }

  private uniqueIds(ids: number[]) {
    return [...new Set(ids)];
  }

  private toListResponse(page: PageRecord) {
    const { contentJson: _json, contentHtml: _html, ...rest } = page;
    return rest;
  }

  private toResponse(page: PageRecord) {
    let contentJson: Record<string, unknown>;
    try {
      contentJson = JSON.parse(page.contentJson) as Record<string, unknown>;
    } catch {
      contentJson = { type: "doc", content: [{ type: "paragraph" }] };
    }
    return { ...page, contentJson };
  }

  private rethrowKnownError(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictException("Slug đã được sử dụng.");
    }
  }
}
