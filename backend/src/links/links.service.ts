import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { CreateLinkDto } from "./dto/create-link.dto";

@Injectable()
export class LinksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createLinkDto: CreateLinkDto) {
    await this.validateDestination(createLinkDto);

    const slug = await this.createUniqueSlug(
      createLinkDto.customAlias || createLinkDto.title,
    );
    const background = createLinkDto.backgroundSettings;
    const effects = background?.effects;

    try {
      const link = await this.prisma.link.create({
        data: {
          slug,
          destinationUrl: createLinkDto.destinationUrl,
          title: createLinkDto.title.trim(),
          inputType: createLinkDto.inputType,
          selectedSnippet: this.emptyToNull(createLinkDto.selectedSnippet),
          selectedFile: this.emptyToNull(createLinkDto.selectedFile),
          subtitle: this.emptyToNull(createLinkDto.subtitle),
          customAlias: this.emptyToNull(createLinkDto.customAlias),
          coverImageUrl: this.emptyToNull(createLinkDto.coverImageUrl),
          expiryEnabled: createLinkDto.expiryEnabled ?? false,
          expiryType: this.emptyToNull(createLinkDto.expiryType),
          expiryDate: this.buildExpiryDate(createLinkDto),
          expiryTime: this.emptyToNull(createLinkDto.expiryTime),
          maxClicks: createLinkDto.maxClicks ?? null,
          selectedBackgroundId: this.emptyToNull(background?.selectedBackgroundId),
          selectedBackgroundName: this.emptyToNull(
            background?.selectedBackgroundName,
          ),
          sameAsCoverImage: background?.sameAsCoverImage ?? false,
          opacity: effects?.opacity ?? 100,
          blur: effects?.blur ?? 0,
          saturation: effects?.saturation ?? 100,
          contrast: effects?.contrast ?? 100,
          grayscale: effects?.grayscale ?? 0,
          actions: {
            create: createLinkDto.actions.map((action) => ({
              platform: action.platform,
              action: action.action,
              url: action.url,
            })),
          },
        },
        include: {
          actions: true,
        },
      });

      return this.toResponse(link);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Slug hoặc custom alias đã tồn tại.");
      }

      throw error;
    }
  }

  async findAll() {
    const links = await this.prisma.link.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        actions: true,
      },
    });

    return links.map((link) => this.toResponse(link));
  }

  async findOne(slug: string) {
    const link = await this.prisma.link.findUnique({
      where: {
        slug,
      },
      include: {
        actions: true,
      },
    });

    if (!link) {
      throw new NotFoundException("Không tìm thấy link.");
    }

    return this.toResponse(link);
  }

  async update(id: string, updateLinkDto: CreateLinkDto) {
    await this.validateDestination(updateLinkDto);

    const existing = await this.prisma.link.findUnique({
      where: {
        id,
      },
    });

    if (!existing) {
      throw new NotFoundException("Không tìm thấy link.");
    }

    const background = updateLinkDto.backgroundSettings;
    const effects = background?.effects;

    const link = await this.prisma.$transaction(async (prisma) => {
      await prisma.linkAction.deleteMany({
        where: {
          linkId: id,
        },
      });

      return prisma.link.update({
        where: {
          id,
        },
        data: {
          destinationUrl: updateLinkDto.destinationUrl,
          title: updateLinkDto.title.trim(),
          inputType: updateLinkDto.inputType,
          selectedSnippet: this.emptyToNull(updateLinkDto.selectedSnippet),
          selectedFile: this.emptyToNull(updateLinkDto.selectedFile),
          subtitle: this.emptyToNull(updateLinkDto.subtitle),
          customAlias: this.emptyToNull(updateLinkDto.customAlias),
          coverImageUrl: this.emptyToNull(updateLinkDto.coverImageUrl),
          expiryEnabled: updateLinkDto.expiryEnabled ?? false,
          expiryType: this.emptyToNull(updateLinkDto.expiryType),
          expiryDate: this.buildExpiryDate(updateLinkDto),
          expiryTime: this.emptyToNull(updateLinkDto.expiryTime),
          maxClicks: updateLinkDto.maxClicks ?? null,
          selectedBackgroundId: this.emptyToNull(background?.selectedBackgroundId),
          selectedBackgroundName: this.emptyToNull(
            background?.selectedBackgroundName,
          ),
          sameAsCoverImage: background?.sameAsCoverImage ?? false,
          opacity: effects?.opacity ?? 100,
          blur: effects?.blur ?? 0,
          saturation: effects?.saturation ?? 100,
          contrast: effects?.contrast ?? 100,
          grayscale: effects?.grayscale ?? 0,
          actions: {
            create: updateLinkDto.actions.map((action) => ({
              platform: action.platform,
              action: action.action,
              url: action.url,
            })),
          },
        },
        include: {
          actions: true,
        },
      });
    });

    return this.toResponse(link);
  }

  private async createUniqueSlug(source: string) {
    const baseSlug = this.slugify(source) || `link-${Date.now()}`;
    let slug = baseSlug;
    let suffix = 1;

    while (await this.prisma.link.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return slug;
  }

  private async validateDestination(createLinkDto: CreateLinkDto) {
    if (createLinkDto.inputType !== "file") {
      return;
    }

    if (!createLinkDto.selectedFile) {
      throw new BadRequestException("Vui lòng chọn file destination.");
    }

    const file = await this.prisma.managedFile.findFirst({
      where: {
        id: createLinkDto.selectedFile,
        deletedAt: null,
      },
    });

    if (!file) {
      throw new BadRequestException("File destination không tồn tại.");
    }
  }

  private slugify(value: string) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
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

  private buildExpiryDate(createLinkDto: CreateLinkDto) {
    if (!createLinkDto.expiryEnabled || createLinkDto.expiryType !== "date") {
      return null;
    }

    if (!createLinkDto.expiryDate) {
      return null;
    }

    const time = createLinkDto.expiryTime || "00:00";
    return new Date(`${createLinkDto.expiryDate}T${time}:00`);
  }

  private toResponse(
    link: Prisma.LinkGetPayload<{
      include: {
        actions: true;
      };
    }>,
  ) {
    return {
      id: link.id,
      slug: link.slug,
      shortUrl: `/l/${link.slug}`,
      destinationUrl: link.destinationUrl,
      title: link.title,
      inputType: link.inputType,
      selectedSnippet: link.selectedSnippet,
      selectedFile: link.selectedFile,
      subtitle: link.subtitle,
      customAlias: link.customAlias,
      coverImageUrl: link.coverImageUrl,
      expiryEnabled: link.expiryEnabled,
      expiryType: link.expiryType,
      expiryDate: link.expiryDate,
      expiryTime: link.expiryTime,
      maxClicks: link.maxClicks,
      clicks: link.clicks,
      status: link.status,
      actions: link.actions.map((action) => ({
        id: action.id,
        platform: action.platform,
        action: action.action,
        url: action.url,
      })),
      backgroundSettings: {
        selectedBackgroundId: link.selectedBackgroundId,
        selectedBackgroundName: link.selectedBackgroundName,
        sameAsCoverImage: link.sameAsCoverImage,
        effects: {
          opacity: link.opacity,
          blur: link.blur,
          saturation: link.saturation,
          contrast: link.contrast,
          grayscale: link.grayscale,
        },
      },
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
    };
  }
}
