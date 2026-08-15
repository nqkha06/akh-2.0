import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";
import type { AuthenticatedUser } from "../auth/auth.types";
import {
  emptyPageValueToNull,
  localizedPageSlugCandidates,
  normalizePageSlug,
  sanitizePageContent,
  serializePageContent,
} from "./pages-content";
import type { BulkUpdatePagesStatusDto } from "./dto/bulk-pages.dto";
import type { CreatePageDto } from "./dto/create-page.dto";
import type { QueryPagesDto } from "./dto/query-pages.dto";
import type { UpdatePageStatusDto } from "./dto/update-page-status.dto";
import type { UpdatePageDto } from "./dto/update-page.dto";
import { PAGE_STATUSES, type PageStatus } from "./pages.constants";
import {
  mapPageDetail,
  mapPageListItem,
  mapPublicPage,
} from "./pages.mapper";
import {
  assertPageCanPublish,
  assertPageStatusTransition,
} from "./pages.policy";
import { buildPagesListQuery } from "./queries/pages-list-query.builder";
import { PAGE_INCLUDE, PUBLIC_PAGE_SELECT } from "./pages.select";

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryPagesDto) {
    const { where, orderBy, skip, take, appliedSort } =
      buildPagesListQuery(query);
    const [records, total] = await this.prisma.$transaction([
      this.prisma.page.findMany({
        where,
        skip,
        take,
        orderBy,
        include: PAGE_INCLUDE,
      }),
      this.prisma.page.count({ where }),
    ]);
    const items = records.map(mapPageListItem);
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
    return mapPageDetail(await this.findRecord(id));
  }

  async findPublicBySlug(input: string, locale?: string) {
    const slug = input.trim().toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new NotFoundException("Không tìm thấy trang.");
    }

    const candidates = localizedPageSlugCandidates(slug, locale);
    const localizedSlug = candidates[0];
    const pages = await this.prisma.page.findMany({
      where: {
        slug: { in: candidates },
        status: "PUBLISHED",
        deletedAt: null,
      },
      select: PUBLIC_PAGE_SELECT,
    });
    const page =
      pages.find((candidate) => candidate.slug === localizedSlug) ??
      pages.find((candidate) => candidate.slug === slug);
    if (!page) throw new NotFoundException("Không tìm thấy trang.");

    return mapPublicPage(page);
  }

  async create(dto: CreatePageDto, user: AuthenticatedUser) {
    if (dto.status === "PUBLISHED") assertPageCanPublish(user);
    const slug = normalizePageSlug(dto.slug || dto.title);
    await this.assertSlugAvailable(slug);
    await this.assertFeaturedImage(dto.featuredImageId);
    const contentJson = serializePageContent(dto.contentJson);

    try {
      const page = await this.prisma.page.create({
        data: {
          title: dto.title.trim(),
          slug,
          excerpt: emptyPageValueToNull(dto.excerpt),
          contentJson,
          contentHtml: sanitizePageContent(dto.contentHtml ?? ""),
          status: dto.status,
          featuredImageId: dto.featuredImageId || null,
          seoTitle: emptyPageValueToNull(dto.seoTitle),
          seoDescription: emptyPageValueToNull(dto.seoDescription),
          seoKeywords: emptyPageValueToNull(dto.seoKeywords),
          canonicalUrl: emptyPageValueToNull(dto.canonicalUrl),
          robotsIndex: dto.robotsIndex,
          robotsFollow: dto.robotsFollow,
          sortOrder: dto.sortOrder,
          publishedAt: dto.status === "PUBLISHED" ? new Date() : null,
        },
        include: PAGE_INCLUDE,
      });
      return mapPageDetail(page);
    } catch (error) {
      this.throwPersistenceError(error);
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
      dto.slug === undefined ? undefined : normalizePageSlug(dto.slug);
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
            ? { excerpt: emptyPageValueToNull(dto.excerpt) }
            : {}),
          ...(dto.contentJson !== undefined
            ? { contentJson: serializePageContent(dto.contentJson) }
            : {}),
          ...(dto.contentHtml !== undefined
            ? { contentHtml: sanitizePageContent(dto.contentHtml) }
            : {}),
          ...(dto.featuredImageId !== undefined
            ? { featuredImageId: dto.featuredImageId || null }
            : {}),
          ...(dto.seoTitle !== undefined
            ? { seoTitle: emptyPageValueToNull(dto.seoTitle) }
            : {}),
          ...(dto.seoDescription !== undefined
            ? { seoDescription: emptyPageValueToNull(dto.seoDescription) }
            : {}),
          ...(dto.seoKeywords !== undefined
            ? { seoKeywords: emptyPageValueToNull(dto.seoKeywords) }
            : {}),
          ...(dto.canonicalUrl !== undefined
            ? { canonicalUrl: emptyPageValueToNull(dto.canonicalUrl) }
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
        include: PAGE_INCLUDE,
      });
      return mapPageDetail(page);
    } catch (error) {
      this.throwPersistenceError(error);
    }
  }

  async updateStatus(
    id: number,
    dto: UpdatePageStatusDto,
    user: AuthenticatedUser,
  ) {
    await this.prisma.$transaction(async (prisma) => {
      const current = await prisma.page.findFirst({
        where: { id, deletedAt: null },
        select: { status: true },
      });
      if (!current) throw new NotFoundException("Không tìm thấy trang.");
      assertPageStatusTransition(this.toPageStatus(current.status), dto.status);
      if (dto.status === "PUBLISHED") assertPageCanPublish(user);
      await this.applyStatus(prisma, [id], dto.status);
    });
    return this.findOne(id);
  }

  async updateManyStatuses(
    dto: BulkUpdatePagesStatusDto,
    user: AuthenticatedUser,
  ) {
    const ids = this.uniqueIds(dto.ids);
    const updated = await this.prisma.$transaction(async (prisma) => {
      if (dto.status === "PUBLISHED") assertPageCanPublish(user);
      const records = await prisma.page.findMany({
        where: { id: { in: ids }, deletedAt: null },
        select: { id: true, status: true },
      });
      if (records.length !== ids.length) {
        throw new NotFoundException("Một hoặc nhiều trang không tồn tại.");
      }
      for (const record of records) {
        assertPageStatusTransition(
          this.toPageStatus(record.status),
          dto.status,
        );
      }
      return this.applyStatus(prisma, ids, dto.status);
    });
    return { updated };
  }

  async remove(id: number) {
    await this.findRecord(id);
    const result = await this.removeMany([id]);
    return { id, ...result };
  }

  async removeMany(inputIds: number[]) {
    const ids = this.uniqueIds(inputIds);
    const menuReferences = await this.prisma.websiteMenuItem.findMany({
      where: {
        pageId: { in: ids },
        deletedAt: null,
        menu: { deletedAt: null },
      },
      select: {
        pageId: true,
        menu: { select: { id: true, name: true } },
      },
    });
    if (menuReferences.length) {
      throw new ConflictException({
        code: "PAGE_IN_USE",
        message: "Không thể xóa trang đang được dùng trong menu website.",
        references: menuReferences,
      });
    }
    const result = await this.prisma.page.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return { deleted: result.count };
  }

  private async applyStatus(
    prisma: Prisma.TransactionClient,
    ids: number[],
    status: PageStatus,
  ) {
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
  }

  private async findRecord(id: number) {
    const page = await this.prisma.page.findFirst({
      where: { id, deletedAt: null },
      include: PAGE_INCLUDE,
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
    const file = await this.prisma.adminMedia.findFirst({
      where: { id, deletedAt: null },
      select: { mimeType: true },
    });
    if (!file || !file.mimeType.toLowerCase().startsWith("image/")) {
      throw new BadRequestException(
        "Featured image phải là ảnh còn hoạt động trong Admin Media.",
      );
    }
  }

  private toPageStatus(value: string): PageStatus {
    const status = PAGE_STATUSES.find((candidate) => candidate === value);
    if (!status) {
      throw new BadRequestException("Trạng thái trang không hợp lệ.");
    }
    return status;
  }

  private uniqueIds(ids: number[]) {
    return [...new Set(ids)];
  }

  private throwPersistenceError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictException("Slug đã được sử dụng.");
    }
    throw error;
  }
}
