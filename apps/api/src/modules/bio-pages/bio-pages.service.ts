import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, type BioPage } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";
import { CreateBioPageDto } from "./dto/create-bio-page.dto";

type StoredSocialLink = CreateBioPageDto["socialLinks"][number];
type StoredCustomLink = CreateBioPageDto["customLinks"][number] & {
  isVisible?: boolean;
};
type StoredWidget = CreateBioPageDto["widgets"][number];

type StoredBioContent = {
  socialLinks: StoredSocialLink[];
  customLinks: StoredCustomLink[];
  widgets: StoredWidget[];
};

type StoredBioAppearance = CreateBioPageDto["appearance"];

const EMPTY_CONTENT: StoredBioContent = {
  socialLinks: [],
  customLinks: [],
  widgets: [],
};

const DEFAULT_APPEARANCE: StoredBioAppearance = {
  buttonStyle: "rounded",
  backgroundColor: "#ffffff",
};

@Injectable()
export class BioPagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateBioPageDto) {
    this.validatePayload(dto);
    const slug = await this.createUniqueSlug(dto.customSlug || dto.name);
    const status = dto.status || "published";

    try {
      const bioPage = await this.prisma.bioPage.create({
        data: {
          userId,
          slug,
          name: dto.name.trim(),
          title: this.emptyToNull(dto.title),
          status,
          contentJson: this.serializeContent(dto),
          appearanceJson: JSON.stringify(dto.appearance),
          publishedAt: status === "published" ? new Date() : null,
        },
      });
      return this.toResponse(bioPage);
    } catch (error) {
      this.rethrowUniqueSlug(error);
      throw error;
    }
  }

  async update(userId: number, id: string, dto: CreateBioPageDto) {
    this.validatePayload(dto);
    const existing = await this.findOwnedPage(userId, id);
    const requestedSlug = dto.customSlug
      ? this.slugify(dto.customSlug)
      : existing.slug;

    if (!requestedSlug) {
      throw new BadRequestException("Slug bio không hợp lệ.");
    }

    if (requestedSlug !== existing.slug) {
      const conflictingPage = await this.prisma.bioPage.findUnique({
        where: { slug: requestedSlug },
        select: { id: true },
      });
      if (conflictingPage) {
        throw new ConflictException("Slug bio đã tồn tại.");
      }
    }

    const status = dto.status || "published";
    try {
      const bioPage = await this.prisma.bioPage.update({
        where: { id: existing.id },
        data: {
          slug: requestedSlug,
          name: dto.name.trim(),
          title: this.emptyToNull(dto.title),
          status,
          contentJson: this.serializeContent(dto),
          appearanceJson: JSON.stringify(dto.appearance),
          ...(status === "published" && !existing.publishedAt
            ? { publishedAt: new Date() }
            : {}),
        },
      });
      return this.toResponse(bioPage);
    } catch (error) {
      this.rethrowUniqueSlug(error);
      throw error;
    }
  }

  async findAll(userId: number) {
    const bioPages = await this.prisma.bioPage.findMany({
      where: { userId, deletedAt: null },
      orderBy: { updatedAt: "desc" },
    });
    return bioPages.map((bioPage) => this.toResponse(bioPage));
  }

  async findOneForMember(userId: number, id: string) {
    return this.toResponse(await this.findOwnedPage(userId, id));
  }

  async remove(userId: number, id: string) {
    const existing = await this.findOwnedPage(userId, id);
    await this.prisma.bioPage.update({
      where: { id: existing.id },
      data: {
        slug: `${existing.slug}--deleted-${Date.now()}`,
        status: "archived",
        deletedAt: new Date(),
      },
    });
    return { id: existing.id, deleted: true as const };
  }

  async findPublic(slug: string) {
    const existing = await this.prisma.bioPage.findFirst({
      where: {
        slug,
        status: "published",
        deletedAt: null,
        userId: { not: null },
      },
    });
    if (!existing) {
      throw new NotFoundException("Không tìm thấy bio page.");
    }

    const bioPage = await this.prisma.bioPage.update({
      where: { id: existing.id },
      data: { views: { increment: 1 } },
    });
    return this.toResponse(bioPage);
  }

  async trackClick(slug: string) {
    const existing = await this.prisma.bioPage.findFirst({
      where: {
        slug,
        status: "published",
        deletedAt: null,
        userId: { not: null },
      },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException("Không tìm thấy bio page.");
    }

    const bioPage = await this.prisma.bioPage.update({
      where: { id: existing.id },
      data: { clicks: { increment: 1 } },
      select: { clicks: true },
    });
    return { clicks: bioPage.clicks };
  }

  private async findOwnedPage(userId: number, id: string) {
    const bioPage = await this.prisma.bioPage.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!bioPage) {
      throw new NotFoundException("Không tìm thấy bio page.");
    }
    return bioPage;
  }

  private validatePayload(dto: CreateBioPageDto) {
    if (!dto.name.trim()) {
      throw new BadRequestException("Tên bio là bắt buộc.");
    }
    if (
      dto.socialLinks.length === 0 &&
      dto.customLinks.length === 0 &&
      dto.widgets.length === 0
    ) {
      throw new BadRequestException(
        "Bio cần ít nhất một link, social hoặc widget.",
      );
    }
  }

  private serializeContent(dto: CreateBioPageDto) {
    const hiddenLinkIds = new Set(dto.hiddenLinks);
    const content: StoredBioContent = {
      socialLinks: dto.socialLinks,
      customLinks: dto.customLinks.map((link) => ({
        ...link,
        isVisible: !hiddenLinkIds.has(link.id),
      })),
      widgets: dto.widgets,
    };
    return JSON.stringify(content);
  }

  private async createUniqueSlug(source: string) {
    const baseSlug = this.slugify(source) || `bio-${Date.now()}`;
    let slug = baseSlug;
    let suffix = 1;
    while (await this.prisma.bioPage.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
    return slug;
  }

  private slugify(value: string) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/^@+/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private emptyToNull(value?: string | null) {
    if (!value) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private parseJson<T>(value: string, fallback: T): T {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  private rethrowUniqueSlug(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictException("Slug bio đã tồn tại.");
    }
  }

  private toResponse(bioPage: BioPage) {
    const content = this.parseJson<StoredBioContent>(
      bioPage.contentJson,
      EMPTY_CONTENT,
    );
    const appearance = this.parseJson<StoredBioAppearance>(
      bioPage.appearanceJson,
      DEFAULT_APPEARANCE,
    );
    const customLinks = content.customLinks.map(
      ({ isVisible: _isVisible, ...link }) => link,
    );
    const hiddenLinks = content.customLinks
      .filter((link) => link.isVisible === false)
      .map((link) => link.id);

    return {
      id: bioPage.id,
      slug: bioPage.slug,
      publicUrl: `/b/${bioPage.slug}`,
      name: bioPage.name,
      title: bioPage.title,
      status: bioPage.status,
      views: bioPage.views,
      clicks: bioPage.clicks,
      socialLinks: content.socialLinks,
      customLinks,
      widgets: content.widgets,
      hiddenLinks,
      appearance,
      publishedAt: bioPage.publishedAt,
      createdAt: bioPage.createdAt,
      updatedAt: bioPage.updatedAt,
    };
  }
}
