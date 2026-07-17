import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { CreateLinkDto } from "./dto/create-link.dto";
import { UpdateLinkStatusDto } from "./dto/update-link-status.dto";

const linkInclude = Prisma.validator<Prisma.LinkInclude>()({
  actions: { orderBy: { position: "asc" } },
  destinationFile: true,
  destinationSnippet: true,
});

type LinkWithRelations = Prisma.LinkGetPayload<{ include: typeof linkInclude }>;

type StoredAppearance = {
  coverImageUrl: string | null;
  backgroundSettings: {
    selectedBackgroundId: string | null;
    selectedBackgroundName: string | null;
    backgroundMediaType: string | null;
    backgroundMediaUrl: string | null;
    sameAsCoverImage: boolean;
    effects: {
      opacity: number;
      blur: number;
      saturation: number;
      contrast: number;
      grayscale: number;
    };
  };
};

@Injectable()
export class LinksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, createLinkDto: CreateLinkDto) {
    const title = createLinkDto.title.trim();
    if (!title) {
      throw new BadRequestException("Tiêu đề không được để trống.");
    }

    const destination = await this.resolveDestination(createLinkDto);
    const customAlias = this.normalizeAlias(createLinkDto.customAlias);
    const slug = customAlias || (await this.createUniqueSlug(createLinkDto.title));

    if (customAlias) {
      await this.assertAliasAvailable(customAlias);
    }

    try {
      const link = await this.prisma.link.create({
        data: {
          userId,
          slug,
          title,
          subtitle: this.emptyToNull(createLinkDto.subtitle),
          ...destination,
          appearanceJson: this.serializeAppearance(createLinkDto),
          expiresAt: this.buildExpiryDate(createLinkDto),
          maxClicks: this.buildMaxClicks(createLinkDto),
          actions: {
            create: createLinkDto.actions.map((action, position) => ({
              platform: action.platform,
              action: action.action,
              url: action.url,
              position,
            })),
          },
        },
        include: linkInclude,
      });

      return this.toResponse(link);
    } catch (error) {
      this.rethrowUniqueConstraint(error);
      throw error;
    }
  }

  async findAll(userId: number) {
    const links = await this.prisma.link.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: linkInclude,
    });

    return links.map((link) => this.toResponse(link));
  }

  async checkAlias(alias: string) {
    const normalizedAlias = this.normalizeAlias(alias);
    if (!normalizedAlias) {
      throw new BadRequestException("Alias không hợp lệ.");
    }

    const existing = await this.prisma.link.findUnique({
      where: { slug: normalizedAlias },
      select: { id: true },
    });

    return { alias: normalizedAlias, available: !existing };
  }

  async findOne(slug: string) {
    const link = await this.prisma.link.findUnique({
      where: { slug },
      include: linkInclude,
    });

    if (!link || link.deletedAt) {
      throw new NotFoundException("Không tìm thấy link.");
    }

    return this.toResponse(link);
  }

  async recordVisit(slug: string) {
    return this.prisma.$transaction(async (prisma) => {
      const current = await prisma.link.findUnique({
        where: { slug },
        include: linkInclude,
      });

      if (!current || current.deletedAt) {
        throw new NotFoundException("Không tìm thấy link.");
      }

      if (current.status.toLowerCase() !== "active") {
        return this.toResponse(current);
      }

      const expiredByDate = Boolean(
        current.expiresAt && current.expiresAt.getTime() <= Date.now(),
      );
      const expiredByClicks = Boolean(
        current.maxClicks !== null && current.clicks >= current.maxClicks,
      );

      if (expiredByDate || expiredByClicks) {
        return { ...this.toResponse(current), status: "expired" };
      }

      const visited = await prisma.link.update({
        where: { id: current.id },
        data: { clicks: { increment: 1 } },
        include: linkInclude,
      });

      return this.toResponse(visited);
    });
  }

  async update(userId: number, id: number, updateLinkDto: CreateLinkDto) {
    const title = updateLinkDto.title.trim();
    if (!title) {
      throw new BadRequestException("Tiêu đề không được để trống.");
    }

    const existing = await this.findOwnedLink(userId, id);
    const destination = await this.resolveDestination(updateLinkDto);

    const updated = await this.prisma.$transaction(async (prisma) => {
      await prisma.link.update({
        where: { id },
        data: {
          title,
          subtitle: this.emptyToNull(updateLinkDto.subtitle),
          ...destination,
          appearanceJson: this.serializeAppearance(updateLinkDto),
          expiresAt: this.buildExpiryDate(updateLinkDto),
          maxClicks: this.buildMaxClicks(updateLinkDto),
        },
      });

      const existingActionIds = new Set(existing.actions.map((action) => action.id));
      const retainedActionIds: number[] = [];

      for (const [position, action] of updateLinkDto.actions.entries()) {
        const actionId = this.parseActionId(action.id);

        if (actionId !== null && existingActionIds.has(actionId)) {
          if (retainedActionIds.includes(actionId)) {
            throw new BadRequestException("Action bị trùng ID.");
          }

          await prisma.linkAction.update({
            where: { id: actionId },
            data: {
              platform: action.platform,
              action: action.action,
              url: action.url,
              position,
            },
          });
          retainedActionIds.push(actionId);
        } else {
          const created = await prisma.linkAction.create({
            data: {
              linkId: id,
              platform: action.platform,
              action: action.action,
              url: action.url,
              position,
            },
          });
          retainedActionIds.push(created.id);
        }
      }

      await prisma.linkAction.deleteMany({
        where: {
          linkId: id,
          id: { notIn: retainedActionIds },
        },
      });

      return prisma.link.findUniqueOrThrow({
        where: { id },
        include: linkInclude,
      });
    });

    return this.toResponse(updated);
  }

  async updateStatus(
    userId: number,
    id: number,
    updateStatusDto: UpdateLinkStatusDto,
  ) {
    await this.findOwnedLink(userId, id);

    const link = await this.prisma.link.update({
      where: { id },
      data: { status: updateStatusDto.status },
      include: linkInclude,
    });

    return this.toResponse(link);
  }

  async remove(userId: number, id: number) {
    await this.findOwnedLink(userId, id);

    await this.prisma.link.update({
      where: { id },
      data: { deletedAt: new Date(), status: "inactive" },
    });

    return { id: String(id), deleted: true };
  }

  private async findOwnedLink(userId: number, id: number) {
    const link = await this.prisma.link.findFirst({
      where: { id, userId, deletedAt: null },
      include: linkInclude,
    });

    if (!link) {
      throw new NotFoundException("Không tìm thấy link.");
    }

    return link;
  }

  private async resolveDestination(createLinkDto: CreateLinkDto) {
    if (createLinkDto.inputType === "snippet") {
      if (!createLinkDto.selectedSnippet) {
        throw new BadRequestException("Vui lòng chọn snippet.");
      }

      const snippet = await this.prisma.snippet.findUnique({
        where: { id: createLinkDto.selectedSnippet },
      });
      if (!snippet) {
        throw new BadRequestException("Snippet không tồn tại.");
      }

      return {
        destinationType: "snippet",
        destinationUrl: null,
        destinationFileId: null,
        destinationSnippetId: snippet.id,
      };
    }

    if (createLinkDto.inputType === "file") {
      if (!createLinkDto.selectedFile) {
        throw new BadRequestException("Vui lòng chọn file destination.");
      }

      const file = await this.prisma.managedFile.findFirst({
        where: { id: createLinkDto.selectedFile, deletedAt: null },
      });
      if (!file) {
        throw new BadRequestException("File destination không tồn tại.");
      }

      return {
        destinationType: "file",
        destinationUrl: null,
        destinationFileId: file.id,
        destinationSnippetId: null,
      };
    }

    return {
      destinationType: "url",
      destinationUrl: createLinkDto.destinationUrl.trim(),
      destinationFileId: null,
      destinationSnippetId: null,
    };
  }

  private serializeAppearance(createLinkDto: CreateLinkDto) {
    const background = createLinkDto.backgroundSettings;
    const effects = background?.effects;

    const appearance: StoredAppearance = {
      coverImageUrl: this.emptyToNull(createLinkDto.coverImageUrl),
      backgroundSettings: {
        selectedBackgroundId: this.emptyToNull(background?.selectedBackgroundId),
        selectedBackgroundName: this.emptyToNull(background?.selectedBackgroundName),
        backgroundMediaType: this.emptyToNull(background?.backgroundMediaType),
        backgroundMediaUrl: this.emptyToNull(background?.backgroundMediaUrl),
        sameAsCoverImage: background?.sameAsCoverImage ?? false,
        effects: {
          opacity: effects?.opacity ?? 100,
          blur: effects?.blur ?? 0,
          saturation: effects?.saturation ?? 100,
          contrast: effects?.contrast ?? 100,
          grayscale: effects?.grayscale ?? 0,
        },
      },
    };

    return JSON.stringify(appearance);
  }

  private parseAppearance(value: string): StoredAppearance {
    const fallback: StoredAppearance = {
      coverImageUrl: null,
      backgroundSettings: {
        selectedBackgroundId: null,
        selectedBackgroundName: null,
        backgroundMediaType: null,
        backgroundMediaUrl: null,
        sameAsCoverImage: false,
        effects: {
          opacity: 100,
          blur: 0,
          saturation: 100,
          contrast: 100,
          grayscale: 0,
        },
      },
    };

    try {
      const parsed = JSON.parse(value) as Partial<StoredAppearance>;
      const background = parsed.backgroundSettings;
      const effects = background?.effects;

      return {
        coverImageUrl: this.emptyToNull(parsed.coverImageUrl),
        backgroundSettings: {
          selectedBackgroundId: this.emptyToNull(background?.selectedBackgroundId),
          selectedBackgroundName: this.emptyToNull(background?.selectedBackgroundName),
          backgroundMediaType: this.emptyToNull(background?.backgroundMediaType),
          backgroundMediaUrl: this.emptyToNull(background?.backgroundMediaUrl),
          sameAsCoverImage: background?.sameAsCoverImage ?? false,
          effects: {
            opacity: effects?.opacity ?? 100,
            blur: effects?.blur ?? 0,
            saturation: effects?.saturation ?? 100,
            contrast: effects?.contrast ?? 100,
            grayscale: effects?.grayscale ?? 0,
          },
        },
      };
    } catch {
      return fallback;
    }
  }

  private buildExpiryDate(createLinkDto: CreateLinkDto) {
    if (!createLinkDto.expiryEnabled || createLinkDto.expiryType !== "date") {
      return null;
    }
    if (!createLinkDto.expiryDate) {
      return null;
    }

    const time = createLinkDto.expiryTime || "00:00";
    const expiryDate = new Date(`${createLinkDto.expiryDate}T${time}:00`);
    if (Number.isNaN(expiryDate.getTime()) || expiryDate.getTime() <= Date.now()) {
      throw new BadRequestException("Thời điểm hết hạn phải nằm trong tương lai.");
    }

    return expiryDate;
  }

  private buildMaxClicks(createLinkDto: CreateLinkDto) {
    return createLinkDto.expiryEnabled && createLinkDto.expiryType === "clicks"
      ? createLinkDto.maxClicks ?? null
      : null;
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

  private normalizeAlias(value?: string | null) {
    return value ? this.slugify(value) || null : null;
  }

  private async assertAliasAvailable(alias: string) {
    const existing = await this.prisma.link.findUnique({
      where: { slug: alias },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException("Custom alias đã tồn tại.");
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
    if (!value) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private parseActionId(value?: string) {
    if (!value || !/^\d+$/.test(value)) return null;
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  }

  private rethrowUniqueConstraint(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictException("Slug hoặc custom alias đã tồn tại.");
    }
  }

  private toResponse(link: LinkWithRelations) {
    const appearance = this.parseAppearance(link.appearanceJson);
    const expiresAt = link.expiresAt;
    const destinationUrl =
      link.destinationType === "snippet"
        ? link.destinationSnippet?.content || link.destinationUrl || ""
        : link.destinationType === "file"
          ? this.toFileDestinationUrl(link)
          : link.destinationUrl || "";

    return {
      id: String(link.id),
      slug: link.slug,
      shortUrl: `/l/${link.slug}`,
      destinationUrl,
      title: link.title,
      inputType: link.destinationType,
      selectedSnippet: link.destinationSnippetId,
      selectedFile: link.destinationFileId,
      subtitle: link.subtitle,
      customAlias: link.slug,
      coverImageUrl: appearance.coverImageUrl,
      expiryEnabled: Boolean(link.expiresAt || link.maxClicks !== null),
      expiryType: link.expiresAt ? "date" : link.maxClicks !== null ? "clicks" : null,
      expiryDate: expiresAt?.toISOString() ?? null,
      expiryTime: expiresAt
        ? `${String(expiresAt.getHours()).padStart(2, "0")}:${String(expiresAt.getMinutes()).padStart(2, "0")}`
        : null,
      maxClicks: link.maxClicks,
      clicks: link.clicks,
      status: link.status,
      actions: link.actions.map((action) => ({
        id: String(action.id),
        platform: action.platform,
        action: action.action,
        url: action.url,
        position: action.position,
      })),
      backgroundSettings: appearance.backgroundSettings,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
    };
  }

  private toFileDestinationUrl(link: LinkWithRelations) {
    if (link.destinationFile) {
      return `/api/backend/files/${encodeURIComponent(link.destinationFile.id)}/download`;
    }

    const destinationUrl = link.destinationUrl || "";
    const legacyPath = this.extractLegacyFilePath(destinationUrl);
    return legacyPath ? `/api/backend${legacyPath.slice(4)}` : destinationUrl;
  }

  private extractLegacyFilePath(destinationUrl: string) {
    if (destinationUrl.startsWith("/api/files/")) {
      return destinationUrl;
    }

    try {
      const url = new URL(destinationUrl);
      return url.pathname.startsWith("/api/files/")
        ? `${url.pathname}${url.search}`
        : null;
    } catch {
      return null;
    }
  }
}
