import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, type BioPage } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";
import { FilesService } from "../files/files.service";
import { CreateBioPageDto } from "./dto/create-bio-page.dto";
import {
  GALLERY_ACCEPTED_MIME_TYPES,
  GALLERY_IMAGE_MAX_SIZE,
  GALLERY_MAX_IMAGES,
} from "./gallery.constants";

type StoredSocialLink = CreateBioPageDto["socialLinks"][number];
type StoredCustomLink = CreateBioPageDto["customLinks"][number] & {
  isVisible?: boolean;
};
type StoredWidget = CreateBioPageDto["widgets"][number];
type StoredGallery = CreateBioPageDto["galleries"][number];
type StoredDivider = CreateBioPageDto["dividers"][number];
type StoredBankDetails = CreateBioPageDto["bankDetails"][number];
type StoredContentOrderItem = CreateBioPageDto["contentOrder"][number];

type StoredBioContent = {
  socialLinks: StoredSocialLink[];
  customLinks: StoredCustomLink[];
  widgets: StoredWidget[];
  galleries: StoredGallery[];
  dividers: StoredDivider[];
  bankDetails: StoredBankDetails[];
  contentOrder: StoredContentOrderItem[];
};

type StoredBioAppearance = CreateBioPageDto["appearance"];

const EMPTY_CONTENT: StoredBioContent = {
  socialLinks: [],
  customLinks: [],
  widgets: [],
  galleries: [],
  dividers: [],
  bankDetails: [],
  contentOrder: [],
};

const DEFAULT_APPEARANCE: StoredBioAppearance = {
  buttonStyle: "rounded",
  backgroundColor: "#ffffff",
};

@Injectable()
export class BioPagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
  ) {}

  async create(userId: number, dto: CreateBioPageDto) {
    await this.validatePayload(userId, dto);
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
          appearanceJson: this.serializeAppearance(dto),
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
    const existing = await this.findOwnedPage(userId, id);
    await this.validatePayload(userId, dto);
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
          appearanceJson: this.serializeAppearance(dto),
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
    return this.toResponse(bioPage, true);
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

  async findPublicGalleryImage(slug: string, fileIdValue: string) {
    const fileId = Number(fileIdValue);
    if (!Number.isSafeInteger(fileId) || fileId <= 0) {
      throw new NotFoundException("Không tìm thấy ảnh.");
    }
    const bioPage = await this.prisma.bioPage.findFirst({
      where: { slug, status: "published", deletedAt: null },
      select: { contentJson: true, appearanceJson: true },
    });
    if (!bioPage) throw new NotFoundException("Không tìm thấy bio page.");

    const content = this.parseJson<StoredBioContent>(bioPage.contentJson, EMPTY_CONTENT);
    const appearance = this.parseJson<StoredBioAppearance>(bioPage.appearanceJson, DEFAULT_APPEARANCE);
    const referenced = content.galleries?.some((gallery) =>
      gallery.enabled && gallery.images.some((image) => image.fileId === fileIdValue),
    ) || [appearance.avatarFileId, appearance.backgroundFileId].includes(fileIdValue);
    if (!referenced) throw new NotFoundException("Không tìm thấy ảnh.");
    return this.filesService.previewPublishedImage(fileId);
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

  private async validatePayload(userId: number, dto: CreateBioPageDto) {
    if (!dto.name.trim()) {
      throw new BadRequestException("Tên bio là bắt buộc.");
    }
    if (
      dto.socialLinks.length === 0 &&
      dto.customLinks.length === 0 &&
      dto.widgets.length === 0 &&
      dto.galleries.every((gallery) => gallery.images.length === 0) &&
      dto.dividers.length === 0 &&
      dto.bankDetails.length === 0
    ) {
      throw new BadRequestException(
        "Bio cần ít nhất một khối nội dung.",
      );
    }

    if (
      (dto.status || "published") === "published" &&
      dto.bankDetails.some((block) =>
        block.enabled &&
        (!block.bankName.trim() || !block.accountName.trim() || !block.accountNumber.trim()),
      )
    ) {
      throw new BadRequestException(
        "Thông tin ngân hàng cần tên ngân hàng, chủ tài khoản và số tài khoản.",
      );
    }

    if (new Set(dto.dividers.map(({ id }) => id)).size !== dto.dividers.length) {
      throw new BadRequestException("ID dấu phân cách bị trùng.");
    }
    if (new Set(dto.bankDetails.map(({ id }) => id)).size !== dto.bankDetails.length) {
      throw new BadRequestException("ID thông tin ngân hàng bị trùng.");
    }

    const galleryIds = new Set<string>();
    const imageIds = new Set<string>();
    const fileIds = new Set<number>();
    for (const gallery of dto.galleries) {
      const galleryFileIds = new Set<number>();
      if (galleryIds.has(gallery.id)) {
        throw new BadRequestException("ID bộ sưu tập bị trùng.");
      }
      galleryIds.add(gallery.id);
      if (gallery.images.length > GALLERY_MAX_IMAGES) {
        throw new BadRequestException(`Mỗi bộ sưu tập tối đa ${GALLERY_MAX_IMAGES} ảnh.`);
      }
      for (const image of gallery.images) {
        if (imageIds.has(image.id)) {
          throw new BadRequestException("ID ảnh bộ sưu tập bị trùng.");
        }
        imageIds.add(image.id);
        const fileId = Number(image.fileId);
        if (!Number.isSafeInteger(fileId) || fileId <= 0 || galleryFileIds.has(fileId)) {
          throw new BadRequestException("Ảnh bộ sưu tập không hợp lệ hoặc bị trùng.");
        }
        galleryFileIds.add(fileId);
        fileIds.add(fileId);
      }
    }

    if (dto.appearance.backgroundFileId && dto.appearance.backgroundMediaType !== "image") {
      throw new BadRequestException("File nền chỉ hợp lệ với background dạng ảnh.");
    }
    for (const fileIdValue of [dto.appearance.avatarFileId, dto.appearance.backgroundFileId]) {
      if (!fileIdValue) continue;
      const fileId = Number(fileIdValue);
      if (!Number.isSafeInteger(fileId) || fileId <= 0) {
        throw new BadRequestException("Ảnh đại diện hoặc ảnh nền không hợp lệ.");
      }
      fileIds.add(fileId);
    }

    if (fileIds.size > 0) {
      const files = await this.prisma.memberFile.findMany({
        where: { id: { in: [...fileIds] }, userId, deletedAt: null, status: "completed" },
        select: { id: true, mimeType: true, size: true },
      });
      if (
        files.length !== fileIds.size ||
        files.some((file) =>
          !GALLERY_ACCEPTED_MIME_TYPES.has(file.mimeType.toLowerCase()) ||
          file.size > GALLERY_IMAGE_MAX_SIZE,
        )
      ) {
        throw new BadRequestException("Một hoặc nhiều ảnh không hợp lệ, không còn tồn tại hoặc không thuộc tài khoản.");
      }
    }
  }

  private serializeContent(dto: CreateBioPageDto) {
    const hiddenLinkIds = new Set(dto.hiddenLinks);
    const content: StoredBioContent = {
      socialLinks: dto.socialLinks,
      customLinks: dto.customLinks.map((link) => ({
        ...link,
        animationEffect: link.animationEffect || "none",
        isVisible: !hiddenLinkIds.has(link.id),
      })),
      widgets: dto.widgets,
      galleries: dto.galleries.map((gallery) => ({
        ...gallery,
        images: gallery.images.map((image, sortOrder) => ({
          ...image,
          url: `/api/backend/member/files/${image.fileId}/preview`,
          thumbnailUrl: `/api/backend/member/files/${image.fileId}/preview`,
          sortOrder,
          alt: image.alt?.trim() || undefined,
          caption: image.caption?.trim() || undefined,
          linkUrl: image.linkUrl?.trim() || undefined,
        })),
      })),
      dividers: dto.dividers.map((block) => ({
        ...block,
        label: block.label?.trim() || undefined,
      })),
      bankDetails: dto.bankDetails.map((block) => ({
        ...block,
        title: block.title.trim(),
        bankName: block.bankName.trim(),
        accountName: block.accountName.trim(),
        accountNumber: block.accountNumber.trim(),
        branch: block.branch?.trim() || undefined,
        note: block.note?.trim() || undefined,
      })),
      contentOrder: this.normalizeContentOrder(dto),
    };
    return JSON.stringify(content);
  }

  private serializeAppearance(dto: CreateBioPageDto) {
    const appearance: StoredBioAppearance = {
      ...dto.appearance,
      backgroundImage: dto.appearance.backgroundFileId
        ? `/api/backend/member/files/${dto.appearance.backgroundFileId}/preview`
        : dto.appearance.backgroundImage,
      backgroundMediaUrl: dto.appearance.backgroundFileId
        ? `/api/backend/member/files/${dto.appearance.backgroundFileId}/preview`
        : dto.appearance.backgroundMediaUrl,
    };
    return JSON.stringify(appearance);
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

  private normalizeLinkAnimationEffect(value?: string) {
    return ["pulse", "shake", "bounce", "glow"].includes(value || "")
      ? value as "pulse" | "shake" | "bounce" | "glow"
      : "none" as const;
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

  private normalizeContentOrder(dto: CreateBioPageDto) {
    const valid = new Map<string, StoredContentOrderItem>();
    if (dto.socialLinks.length > 0) valid.set("social:socials", { type: "social", id: "socials" });
    for (const widget of dto.widgets) valid.set(`widget:${widget.id}`, { type: "widget", id: widget.id });
    for (const gallery of dto.galleries) valid.set(`gallery:${gallery.id}`, { type: "gallery", id: gallery.id });
    for (const divider of dto.dividers) valid.set(`divider:${divider.id}`, { type: "divider", id: divider.id });
    for (const bank of dto.bankDetails) valid.set(`bank-details:${bank.id}`, { type: "bank-details", id: bank.id });
    for (const link of dto.customLinks) valid.set(`link:${link.id}`, { type: "link", id: link.id });
    const result: StoredContentOrderItem[] = [];
    const seen = new Set<string>();
    for (const item of dto.contentOrder) {
      const key = `${item.type}:${item.id}`;
      if (!seen.has(key) && valid.has(key)) {
        seen.add(key);
        result.push(valid.get(key)!);
      }
    }
    for (const [key, item] of valid) if (!seen.has(key)) result.push(item);
    return result;
  }

  private toResponse(bioPage: BioPage, publicResponse = false) {
    const content = this.parseJson<StoredBioContent>(
      bioPage.contentJson,
      EMPTY_CONTENT,
    );
    const appearance = this.parseJson<StoredBioAppearance>(
      bioPage.appearanceJson,
      DEFAULT_APPEARANCE,
    );
    const resolveMediaUrl = (fileId: string) => publicResponse
      ? `/api/public/bio-pages/${encodeURIComponent(bioPage.slug)}/media/${encodeURIComponent(fileId)}`
      : `/api/backend/member/files/${fileId}/preview`;
    const resolvedAppearance = {
      ...appearance,
      ...(appearance.avatarFileId
        ? { avatarUrl: resolveMediaUrl(appearance.avatarFileId) }
        : {}),
      ...(appearance.backgroundFileId
        ? {
          backgroundImage: resolveMediaUrl(appearance.backgroundFileId),
          backgroundMediaUrl: resolveMediaUrl(appearance.backgroundFileId),
        }
        : {}),
    };
    const customLinks = content.customLinks.map(
      ({ isVisible: _isVisible, ...link }) => ({
        ...link,
        animationEffect: this.normalizeLinkAnimationEffect(link.animationEffect),
      }),
    );
    const hiddenLinks = content.customLinks
      .filter((link) => link.isVisible === false)
      .map((link) => link.id);
    const galleries = (content.galleries || []).map((gallery) => ({
      ...gallery,
      images: gallery.images.map((image, sortOrder) => {
        const publicUrl = `/api/public/bio-pages/${encodeURIComponent(bioPage.slug)}/media/${encodeURIComponent(image.fileId)}`;
        return {
          ...image,
          url: publicResponse ? publicUrl : `/api/backend/member/files/${image.fileId}/preview`,
          thumbnailUrl: publicResponse ? publicUrl : `/api/backend/member/files/${image.fileId}/preview`,
          sortOrder,
        };
      }),
    }));
    const dividers = content.dividers || [];
    const bankDetails = content.bankDetails || [];
    const fallbackOrder: StoredContentOrderItem[] = [
      ...(content.socialLinks.length > 0 ? [{ type: "social" as const, id: "socials" }] : []),
      ...content.widgets.map(({ id }) => ({ type: "widget" as const, id })),
      ...galleries.map(({ id }) => ({ type: "gallery" as const, id })),
      ...dividers.map(({ id }) => ({ type: "divider" as const, id })),
      ...bankDetails.map(({ id }) => ({ type: "bank-details" as const, id })),
      ...customLinks.map(({ id }) => ({ type: "link" as const, id })),
    ];

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
      galleries,
      dividers,
      bankDetails,
      contentOrder: content.contentOrder?.length ? content.contentOrder : fallbackOrder,
      hiddenLinks,
      appearance: resolvedAppearance,
      publishedAt: bioPage.publishedAt,
      createdAt: bioPage.createdAt,
      updatedAt: bioPage.updatedAt,
    };
  }
}
