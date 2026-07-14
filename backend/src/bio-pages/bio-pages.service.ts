import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, type BioPage } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { CreateBioPageDto } from "./dto/create-bio-page.dto";

@Injectable()
export class BioPagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBioPageDto: CreateBioPageDto) {
    this.validatePayload(createBioPageDto);

    const slug = await this.createUniqueSlug(
      createBioPageDto.customSlug || createBioPageDto.name,
    );

    try {
      const bioPage = await this.prisma.bioPage.create({
        data: {
          slug,
          name: createBioPageDto.name.trim(),
          title: this.emptyToNull(createBioPageDto.title),
          status: createBioPageDto.status || "published",
          buttonStyle: createBioPageDto.appearance.buttonStyle,
          backgroundColor: createBioPageDto.appearance.backgroundColor,
          backgroundImage: this.emptyToNull(
            createBioPageDto.appearance.backgroundImage,
          ),
          backgroundMediaType: createBioPageDto.appearance.backgroundMediaType || null,
          backgroundMediaUrl: this.emptyToNull(
            createBioPageDto.appearance.backgroundMediaUrl,
          ),
          selectedBackgroundId: this.emptyToNull(
            createBioPageDto.appearance.selectedBackgroundId,
          ),
          socialLinksJson: JSON.stringify(createBioPageDto.socialLinks),
          customLinksJson: JSON.stringify(createBioPageDto.customLinks),
          widgetsJson: JSON.stringify(createBioPageDto.widgets),
          hiddenLinksJson: JSON.stringify(createBioPageDto.hiddenLinks),
        },
      });

      return this.toResponse(bioPage);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Slug bio đã tồn tại.");
      }

      throw error;
    }
  }

  async update(id: string, updateBioPageDto: CreateBioPageDto) {
    this.validatePayload(updateBioPageDto);

    const existing = await this.prisma.bioPage.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("Không tìm thấy bio page.");
    }

    const requestedSlug = updateBioPageDto.customSlug
      ? this.slugify(updateBioPageDto.customSlug)
      : existing.slug;

    if (!requestedSlug) {
      throw new BadRequestException("Slug bio không hợp lệ.");
    }

    if (requestedSlug !== existing.slug) {
      const conflictingPage = await this.prisma.bioPage.findUnique({
        where: { slug: requestedSlug },
      });
      if (conflictingPage) {
        throw new ConflictException("Slug bio đã tồn tại.");
      }
    }

    const bioPage = await this.prisma.bioPage.update({
      where: { id },
      data: {
        slug: requestedSlug,
        name: updateBioPageDto.name.trim(),
        title: this.emptyToNull(updateBioPageDto.title),
        status: updateBioPageDto.status || "published",
        buttonStyle: updateBioPageDto.appearance.buttonStyle,
        backgroundColor: updateBioPageDto.appearance.backgroundColor,
        backgroundImage: this.emptyToNull(updateBioPageDto.appearance.backgroundImage),
        backgroundMediaType: updateBioPageDto.appearance.backgroundMediaType || null,
        backgroundMediaUrl: this.emptyToNull(updateBioPageDto.appearance.backgroundMediaUrl),
        selectedBackgroundId: this.emptyToNull(updateBioPageDto.appearance.selectedBackgroundId),
        socialLinksJson: JSON.stringify(updateBioPageDto.socialLinks),
        customLinksJson: JSON.stringify(updateBioPageDto.customLinks),
        widgetsJson: JSON.stringify(updateBioPageDto.widgets),
        hiddenLinksJson: JSON.stringify(updateBioPageDto.hiddenLinks),
      },
    });

    return this.toResponse(bioPage);
  }

  async findAll() {
    const bioPages = await this.prisma.bioPage.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return bioPages.map((bioPage) => this.toResponse(bioPage));
  }

  async findOne(slug: string) {
    const bioPage = await this.prisma.bioPage.update({
      where: {
        slug,
      },
      data: {
        views: {
          increment: 1,
        },
      },
    }).catch(() => null);

    if (!bioPage) {
      throw new NotFoundException("Không tìm thấy bio page.");
    }

    return this.toResponse(bioPage);
  }

  async trackClick(slug: string) {
    const bioPage = await this.prisma.bioPage.update({
      where: {
        slug,
      },
      data: {
        clicks: {
          increment: 1,
        },
      },
    }).catch(() => null);

    if (!bioPage) {
      throw new NotFoundException("Không tìm thấy bio page.");
    }

    return {
      clicks: bioPage.clicks,
    };
  }

  private validatePayload(createBioPageDto: CreateBioPageDto) {
    if (!createBioPageDto.name.trim()) {
      throw new BadRequestException("Tên bio là bắt buộc.");
    }

    if (
      createBioPageDto.socialLinks.length === 0 &&
      createBioPageDto.customLinks.length === 0 &&
      createBioPageDto.widgets.length === 0
    ) {
      throw new BadRequestException("Bio cần ít nhất một link, social hoặc widget.");
    }
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
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private parseJson<T>(value: string, fallback: T) {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  private toResponse(bioPage: BioPage) {
    return {
      id: bioPage.id,
      slug: bioPage.slug,
      publicUrl: `/b/${bioPage.slug}`,
      name: bioPage.name,
      title: bioPage.title,
      status: bioPage.status,
      views: bioPage.views,
      clicks: bioPage.clicks,
      socialLinks: this.parseJson(bioPage.socialLinksJson, []),
      customLinks: this.parseJson(bioPage.customLinksJson, []),
      widgets: this.parseJson(bioPage.widgetsJson, []),
      hiddenLinks: this.parseJson(bioPage.hiddenLinksJson, []),
      appearance: {
        buttonStyle: bioPage.buttonStyle,
        backgroundColor: bioPage.backgroundColor,
        backgroundImage: bioPage.backgroundImage,
        backgroundMediaType: bioPage.backgroundMediaType,
        backgroundMediaUrl: bioPage.backgroundMediaUrl,
        selectedBackgroundId: bioPage.selectedBackgroundId,
      },
      createdAt: bioPage.createdAt,
      updatedAt: bioPage.updatedAt,
    };
  }
}
