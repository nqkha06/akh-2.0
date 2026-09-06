import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { randomInt } from "node:crypto";

import { PrismaService } from "../../database/prisma/prisma.service";
import type {
  MonetizationAdDto,
  MonetizationRouteDto,
} from "../monetization-levels/dto/monetization-level-config.dto";
import { CreateLinkDto } from "./dto/create-link.dto";
import {
  buildVisitorRouteContext,
  resolveMonetizationAds,
  resolveMonetizationRoute,
  type MonetizationPageContext,
  type VisitorRouteContext,
} from "./monetization-route-resolver";
import { UpdateLinkStatusDto } from "./dto/update-link-status.dto";
import { LinkVisitAnalyticsService } from "./link-visit-analytics.service";

const linkInclude = Prisma.validator<Prisma.LinkInclude>()({
  actions: { orderBy: { position: "asc" } },
  destinationFile: true,
  destinationSnippet: true,
});

type LinkWithRelations = Prisma.LinkGetPayload<{ include: typeof linkInclude }>;

const RANDOM_ALIAS_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const RANDOM_ALIAS_LENGTH = 8;
const RANDOM_ALIAS_MAX_ATTEMPTS = 10;

const publicVisitInclude = Prisma.validator<Prisma.LinkInclude>()({
  ...linkInclude,
  user: {
    select: {
      monetizationLevel: {
        select: {
          status: true,
          id: true,
          routesJson: true,
          ratesJson: true,
          metaDataJson: true,
          adsJson: true,
        },
      },
    },
  },
});

type PublicVisitLink = Prisma.LinkGetPayload<{
  include: typeof publicVisitInclude;
}>;

export type LinkVisitorMetadata = {
  countryCode?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  referrer?: string | null;
  pageContext?: MonetizationPageContext;
};

export type ResolvedMonetization = {
  targetUrl: string;
  levelId: number;
  ratesJson: string;
  metaDataJson: string;
};

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
  private readonly monetizationAdsCache = new Map<string, MonetizationAdDto[]>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly visitAnalytics: LinkVisitAnalyticsService,
  ) {}

  async create(userId: number, createLinkDto: CreateLinkDto) {
    const title = createLinkDto.title?.trim() ?? "";

    const destination = await this.resolveDestination(userId, createLinkDto);
    const customAlias = this.normalizeAlias(createLinkDto.customAlias);
    const slug = customAlias || (await this.createUniqueRandomAlias());

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

    return this.toPublicResponse(link);
  }

  async recordVisit(slug: string, visitor: LinkVisitorMetadata = {}) {
    return this.prisma.$transaction(async (prisma) => {
      const current = await prisma.link.findUnique({
        where: { slug },
        include: publicVisitInclude,
      });

      if (!current || current.deletedAt) {
        throw new NotFoundException("Không tìm thấy link.");
      }

      if (current.status.toLowerCase() !== "active") {
        return this.toPublicResponse(current);
      }

      const expiredByDate = Boolean(
        current.expiresAt && current.expiresAt.getTime() <= Date.now(),
      );
      const expiredByClicks = Boolean(
        current.maxClicks !== null && current.views >= current.maxClicks,
      );

      if (expiredByDate || expiredByClicks) {
        return { ...this.toPublicResponse(current), status: "expired" };
      }

      const monetization = await this.resolveMonetizationRedirect(
        prisma,
        current,
        visitor,
      );
      const context = buildVisitorRouteContext(visitor);
      const adsResolution = await this.resolveAds(
        prisma,
        current,
        visitor,
        context,
      );
      const monetizationAds = adsResolution.ads;
      const smartlink = monetizationAds.find(
        (ad) =>
          ad.format === "smartlink" &&
          (ad.placement === "unlock_redirect" || ad.placement === "popunder"),
      );
      const effectiveMonetization = smartlink && adsResolution.level
        ? {
            targetUrl: smartlink.content.targetUrl ?? "",
            levelId: adsResolution.level.id,
            ratesJson: adsResolution.level.ratesJson,
            metaDataJson: adsResolution.level.metaDataJson,
          }
        : adsResolution.hasSmartlinkInventory
          ? null
          : monetization;
      const visitIntent = await this.visitAnalytics.createIntent(
        prisma,
        current,
        effectiveMonetization,
        visitor,
        context,
      );
      const relatedLinks = await this.findRelatedPublicLinks(prisma, current);

      return {
        ...this.toPublicResponse(current),
        relatedLinks,
        showConfig: this.parseShowConfig(adsResolution.level?.metaDataJson),
        // Direct routes and unlock Smartlinks have different responsibilities.
        // The route sends the visitor to the configured renderer (for example
        // WordPress); the Smartlink is returned in monetizationAds and is only
        // used after the final destination click.
        monetizationRedirectUrl: monetization?.targetUrl ?? null,
        monetizationAds: monetizationAds.map(({ id, format, placement, content }) => ({
          id,
          format,
          placement,
          content,
        })),
        visitToken: visitIntent.id,
      };
    });
  }

  private async findRelatedPublicLinks(
    prisma: Prisma.TransactionClient,
    current: PublicVisitLink,
  ) {
    const candidates = await prisma.link.findMany({
      where: {
        userId: current.userId,
        id: { not: current.id },
        status: "active",
        deletedAt: null,
      },
      orderBy: [{ views: "desc" }, { createdAt: "desc" }],
      take: 12,
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        destinationType: true,
        appearanceJson: true,
        expiresAt: true,
        maxClicks: true,
        views: true,
        createdAt: true,
      },
    });
    const now = Date.now();

    return candidates
      .filter((link) => {
        const expiredByDate = Boolean(
          link.expiresAt && link.expiresAt.getTime() <= now,
        );
        const expiredByClicks = Boolean(
          link.maxClicks !== null && link.views >= link.maxClicks,
        );
        return !expiredByDate && !expiredByClicks;
      })
      .slice(0, 3)
      .map((link) => {
        const appearance = this.parseAppearance(link.appearanceJson);

        return {
          id: String(link.id),
          slug: link.slug,
          title: link.title,
          subtitle: link.subtitle,
          inputType: link.destinationType,
          coverImageUrl: this.toPublicAppearanceMediaUrl(
            appearance.coverImageUrl,
            link.slug,
            "cover",
          ),
          views: link.views,
          createdAt: link.createdAt,
        };
      });
  }

  async completeVisit(slug: string, visitToken: string) {
    return this.prisma.$transaction(async (prisma) => {
      await this.visitAnalytics.completeIntent(prisma, slug, visitToken);
      const link = await prisma.link.findUnique({
        where: { slug },
        include: linkInclude,
      });
      if (!link || link.deletedAt) {
        throw new NotFoundException("Không tìm thấy link.");
      }
      return this.toPublicResponse(link);
    });
  }

  async update(userId: number, id: number, updateLinkDto: CreateLinkDto) {
    const title = updateLinkDto.title?.trim() ?? "";

    const existing = await this.findOwnedLink(userId, id);
    const destination = await this.resolveDestination(userId, updateLinkDto);

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

  private async resolveDestination(
    userId: number,
    createLinkDto: CreateLinkDto,
  ) {
    if (createLinkDto.inputType === "snippet") {
      if (!createLinkDto.selectedSnippet) {
        throw new BadRequestException("Vui lòng chọn snippet.");
      }

      const snippetId = Number(createLinkDto.selectedSnippet);
      if (!Number.isSafeInteger(snippetId) || snippetId <= 0) {
        throw new BadRequestException("Snippet không tồn tại.");
      }

      const snippet = await this.prisma.snippet.findFirst({
        where: {
          id: snippetId,
          userId,
          deletedAt: null,
        },
      });
      if (!snippet) {
        throw new BadRequestException("Snippet không tồn tại.");
      }

      return {
        destinationType: "snippet",
        destinationUrl: null,
        destinationFileId: null,
        destinationSnippetId: snippet.id,
        destinationSnippetContent: snippet.content,
      };
    }

    if (createLinkDto.inputType === "file") {
      if (!createLinkDto.selectedFile) {
        throw new BadRequestException("Vui lòng chọn file destination.");
      }

      const fileId = Number(createLinkDto.selectedFile);
      if (!Number.isSafeInteger(fileId) || fileId <= 0) {
        throw new BadRequestException("File destination không tồn tại.");
      }
      const file = await this.prisma.memberFile.findFirst({
        where: { id: fileId, userId, deletedAt: null, status: "completed" },
      });
      if (!file) {
        throw new BadRequestException("File destination không tồn tại.");
      }

      return {
        destinationType: "file",
        destinationUrl: null,
        destinationFileId: file.id,
        destinationSnippetId: null,
        destinationSnippetContent: null,
      };
    }

    return {
      destinationType: "url",
      destinationUrl: createLinkDto.destinationUrl.trim(),
      destinationFileId: null,
      destinationSnippetId: null,
      destinationSnippetContent: null,
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

  private async createUniqueRandomAlias() {
    for (let attempt = 0; attempt < RANDOM_ALIAS_MAX_ATTEMPTS; attempt += 1) {
      const alias = Array.from(
        { length: RANDOM_ALIAS_LENGTH },
        () => RANDOM_ALIAS_ALPHABET[randomInt(RANDOM_ALIAS_ALPHABET.length)],
      ).join("");
      const existing = await this.prisma.link.findUnique({
        where: { slug: alias },
        select: { id: true },
      });

      if (!existing) {
        return alias;
      }
    }

    throw new ConflictException(
      "Không thể tạo alias ngẫu nhiên. Vui lòng thử lại.",
    );
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
        ? link.destinationSnippetContent ||
          link.destinationSnippet?.content ||
          link.destinationUrl ||
          ""
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
      selectedSnippet:
        link.destinationSnippetId === null
          ? null
          : String(link.destinationSnippetId),
      selectedFile:
        link.destinationFileId === null ? null : String(link.destinationFileId),
      destinationFileName: link.destinationFile?.name ?? null,
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
      views: link.views,
      revenue: link.revenue.toString(),
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

  private toPublicResponse(link: LinkWithRelations) {
    const response = this.toResponse(link);

    return {
      ...response,
      coverImageUrl: this.toPublicAppearanceMediaUrl(
        response.coverImageUrl,
        link.slug,
        "cover",
      ),
      backgroundSettings: {
        ...response.backgroundSettings,
        backgroundMediaUrl: this.toPublicAppearanceMediaUrl(
          response.backgroundSettings.backgroundMediaUrl,
          link.slug,
          "background",
        ),
      },
    };
  }

  private toPublicAppearanceMediaUrl(
    value: string | null,
    slug: string,
    kind: "cover" | "background",
  ) {
    if (!value) return null;

    try {
      const path = new URL(value, "http://link4sub.internal").pathname;
      const isOwnedPreview =
        /^\/(?:api\/backend\/)?member\/files\/\d+\/preview\/?$/.test(path);

      return isOwnedPreview
        ? `/api/backend/files/link/${encodeURIComponent(slug)}/${kind}`
        : value;
    } catch {
      return value;
    }
  }

  private toFileDestinationUrl(link: LinkWithRelations) {
    if (link.destinationFile) {
      return `/api/public/files/${encodeURIComponent(link.slug)}`;
    }

    const destinationUrl = link.destinationUrl || "";
    const legacyPath = this.extractLegacyFilePath(destinationUrl);
    return legacyPath ? `/api/public/files/${encodeURIComponent(link.slug)}` : destinationUrl;
  }

  private async resolveMonetizationRedirect(
    prisma: Prisma.TransactionClient,
    link: PublicVisitLink,
    visitor: LinkVisitorMetadata,
  ): Promise<ResolvedMonetization | null> {
    let level = link.user.monetizationLevel;
    if (!level || level.status !== "published") {
      level = await prisma.monetizationLevel.findFirst({
        where: { isDefault: true, status: "published" },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        select: {
          id: true,
          status: true,
          routesJson: true,
          ratesJson: true,
          metaDataJson: true,
          adsJson: true,
        },
      });
    }

    if (!level) return null;

    const routes = this.parseMonetizationRoutes(level.routesJson);
    const context = buildVisitorRouteContext(visitor);
    const route = resolveMonetizationRoute(routes, {
      ...context,
      visitorKey: `${link.id}|${context.visitorKey}`,
    });

    if (!route) return null;

    return {
      targetUrl: route.targetUrl,
      levelId: level.id,
      ratesJson: level.ratesJson,
      metaDataJson: level.metaDataJson,
    };
  }

  private async resolveAds(
    prisma: Prisma.TransactionClient,
    link: PublicVisitLink,
    visitor: LinkVisitorMetadata,
    context: VisitorRouteContext,
  ) {
    let level = link.user.monetizationLevel;
    if (!level || level.status !== "published") {
      level = await prisma.monetizationLevel.findFirst({
        where: { isDefault: true, status: "published" },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        select: {
          id: true,
          status: true,
          routesJson: true,
          ratesJson: true,
          metaDataJson: true,
          adsJson: true,
        },
      });
    }
    if (!level) return { ads: [], level: null, hasSmartlinkInventory: false };
    const configuredAds = this.parseMonetizationAds(level.adsJson);
    return {
      ads: resolveMonetizationAds(
        configuredAds,
        { ...context, visitorKey: `${link.id}|${context.visitorKey}` },
        {
          ...visitor.pageContext,
          selectionSeed: randomInt(0, 2_147_483_647),
        },
      ),
      level,
      hasSmartlinkInventory: configuredAds.some(
        (ad) =>
          ad.enabled &&
          ad.format === "smartlink" &&
          ad.placements.some(
            (placement) =>
              placement === "unlock_redirect" || placement === "popunder",
          ) &&
          (ad.content.smartlinks !== undefined
            ? ad.content.smartlinks.some((smartlink) => smartlink.enabled)
            : Boolean(ad.content.targetUrl)),
      ),
    };
  }

  private parseMonetizationRoutes(value: string): MonetizationRouteDto[] {
    try {
      const routes = JSON.parse(value) as unknown;
      if (!Array.isArray(routes)) return [];

      return routes.filter(
        (route): route is MonetizationRouteDto =>
          typeof route === "object" &&
          route !== null &&
          typeof (route as MonetizationRouteDto).targetUrl === "string",
      );
    } catch {
      return [];
    }
  }

  private parseMonetizationAds(value: string): MonetizationAdDto[] {
    const cached = this.monetizationAdsCache.get(value);
    if (cached) return cached;
    try {
      const ads = JSON.parse(value) as unknown;
      if (!Array.isArray(ads)) return [];
      const parsed = ads.filter(
        (ad): ad is MonetizationAdDto =>
          typeof ad === "object" &&
          ad !== null &&
          typeof (ad as MonetizationAdDto).id === "string" &&
          Array.isArray((ad as MonetizationAdDto).placements),
      );
      if (this.monetizationAdsCache.size >= 100) {
        const oldest = this.monetizationAdsCache.keys().next().value;
        if (oldest !== undefined) this.monetizationAdsCache.delete(oldest);
      }
      this.monetizationAdsCache.set(value, parsed);
      return parsed;
    } catch {
      return [];
    }
  }

  private parseShowConfig(value?: string | null) {
    if (!value) return { pageCount: 1 };
    try {
      const parsed = JSON.parse(value) as { stepCount?: unknown };
      const pageCount = Number(parsed?.stepCount);
      return {
        pageCount: Number.isInteger(pageCount)
          ? Math.max(1, Math.min(20, pageCount))
          : 1,
      };
    } catch {
      return { pageCount: 1 };
    }
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
