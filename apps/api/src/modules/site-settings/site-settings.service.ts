import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AdminMedia, WebsiteSettings } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";
import {
  SOCIAL_PLATFORMS,
  type UpdateWebsiteSettingsDto,
  type WebsiteSocialLinkDto,
} from "./dto/update-website-settings.dto";

const SETTINGS_ID = 1;
const mediaSelect = {
  id: true,
  fileName: true,
  mimeType: true,
  extension: true,
  url: true,
} as const;

const settingsInclude = {
  logoLight: { select: mediaSelect },
  logoDark: { select: mediaSelect },
  logoIcon: { select: mediaSelect },
  favicon: { select: mediaSelect },
  defaultOgImage: { select: mediaSelect },
} as const;

type SettingsWithMedia = WebsiteSettings & {
  logoLight: Pick<AdminMedia, "id" | "fileName" | "mimeType" | "extension" | "url"> | null;
  logoDark: Pick<AdminMedia, "id" | "fileName" | "mimeType" | "extension" | "url"> | null;
  logoIcon: Pick<AdminMedia, "id" | "fileName" | "mimeType" | "extension" | "url"> | null;
  favicon: Pick<AdminMedia, "id" | "fileName" | "mimeType" | "extension" | "url"> | null;
  defaultOgImage: Pick<AdminMedia, "id" | "fileName" | "mimeType" | "extension" | "url"> | null;
};

@Injectable()
export class SiteSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminSettings() {
    return this.toAdminResponse(await this.findOrCreate());
  }

  async getPublicSettings() {
    const settings = await this.findOrCreate();
    return {
      siteName: settings.siteName,
      siteShortName: settings.siteShortName,
      siteDescription: settings.siteDescription,
      siteTagline: settings.siteTagline,
      siteUrl: settings.siteUrl,
      branding: {
        logoLight: this.toPublicMedia(settings.logoLight),
        logoDark: this.toPublicMedia(settings.logoDark),
        logoIcon: this.toPublicMedia(settings.logoIcon),
        favicon: this.toPublicMedia(settings.favicon),
        defaultOgImage: this.toPublicMedia(settings.defaultOgImage),
      },
      socialLinks: this.parseSocialLinks(settings.socialLinksJson)
        .filter((link) => link.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder),
      contact: {
        email: settings.contactEmail,
        supportEmail: settings.supportEmail,
        phone: settings.phone,
        address: settings.address,
        workingHours: settings.workingHours,
        mapUrl: settings.mapUrl,
      },
      updatedAt: settings.updatedAt,
    };
  }

  async update(dto: UpdateWebsiteSettingsDto, adminId: number) {
    this.assertUniquePlatforms(dto.socialLinks);
    await this.validateMediaIds([
      dto.logoLightId,
      dto.logoDarkId,
      dto.logoIconId,
      dto.faviconId,
      dto.defaultOgImageId,
    ]);

    const settings = await this.prisma.websiteSettings.upsert({
      where: { id: SETTINGS_ID },
      create: {
        id: SETTINGS_ID,
        ...this.toPersistence(dto),
        updatedById: adminId,
      },
      update: {
        ...this.toPersistence(dto),
        updatedById: adminId,
      },
      include: settingsInclude,
    });
    return this.toAdminResponse(settings);
  }

  private async findOrCreate() {
    return this.prisma.websiteSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID },
      update: {},
      include: settingsInclude,
    });
  }

  private toPersistence(dto: UpdateWebsiteSettingsDto) {
    return {
      siteName: dto.siteName,
      siteShortName: dto.siteShortName ?? null,
      siteDescription: dto.siteDescription ?? null,
      siteTagline: dto.siteTagline ?? null,
      siteUrl: dto.siteUrl ?? null,
      logoLightId: dto.logoLightId ?? null,
      logoDarkId: dto.logoDarkId ?? null,
      logoIconId: dto.logoIconId ?? null,
      faviconId: dto.faviconId ?? null,
      defaultOgImageId: dto.defaultOgImageId ?? null,
      socialLinksJson: JSON.stringify(
        [...dto.socialLinks].sort((a, b) => a.sortOrder - b.sortOrder),
      ),
      contactEmail: dto.contactEmail ?? null,
      supportEmail: dto.supportEmail ?? null,
      phone: dto.phone ?? null,
      address: dto.address ?? null,
      workingHours: dto.workingHours ?? null,
      mapUrl: dto.mapUrl ?? null,
    };
  }

  private toAdminResponse(settings: SettingsWithMedia) {
    return {
      id: settings.id,
      siteName: settings.siteName,
      siteShortName: settings.siteShortName,
      siteDescription: settings.siteDescription,
      siteTagline: settings.siteTagline,
      siteUrl: settings.siteUrl,
      logoLightId: settings.logoLightId,
      logoDarkId: settings.logoDarkId,
      logoIconId: settings.logoIconId,
      faviconId: settings.faviconId,
      defaultOgImageId: settings.defaultOgImageId,
      branding: {
        logoLight: this.toPublicMedia(settings.logoLight),
        logoDark: this.toPublicMedia(settings.logoDark),
        logoIcon: this.toPublicMedia(settings.logoIcon),
        favicon: this.toPublicMedia(settings.favicon),
        defaultOgImage: this.toPublicMedia(settings.defaultOgImage),
      },
      socialLinks: this.parseSocialLinks(settings.socialLinksJson),
      contactEmail: settings.contactEmail,
      supportEmail: settings.supportEmail,
      phone: settings.phone,
      address: settings.address,
      workingHours: settings.workingHours,
      mapUrl: settings.mapUrl,
      updatedAt: settings.updatedAt,
    };
  }

  private toPublicMedia(
    file: Pick<AdminMedia, "id" | "fileName" | "mimeType" | "extension" | "url"> | null,
  ) {
    return file
      ? {
          id: file.id,
          alias: file.id,
          name: file.fileName,
          mimeType: file.mimeType,
          extension: file.extension,
          downloadUrl: file.url,
        }
      : null;
  }

  private parseSocialLinks(value: string): WebsiteSocialLinkDto[] {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (item): item is WebsiteSocialLinkDto =>
          typeof item === "object" &&
          item !== null &&
          "platform" in item &&
          SOCIAL_PLATFORMS.includes(
            (item as WebsiteSocialLinkDto).platform,
          ) &&
          "url" in item &&
          typeof (item as WebsiteSocialLinkDto).url === "string" &&
          (item as WebsiteSocialLinkDto).url.startsWith("https://"),
      );
    } catch {
      return [];
    }
  }

  private assertUniquePlatforms(links: WebsiteSocialLinkDto[]) {
    const platforms = links.map((link) => link.platform);
    if (new Set(platforms).size !== platforms.length) {
      throw new BadRequestException(
        "Mỗi nền tảng mạng xã hội chỉ được cấu hình một lần.",
      );
    }
  }

  private async validateMediaIds(ids: Array<string | null | undefined>) {
    const uniqueIds = [...new Set(ids.filter((id): id is string => Boolean(id)))];
    if (uniqueIds.length === 0) return;
    const files = await this.prisma.adminMedia.findMany({
      where: { id: { in: uniqueIds }, deletedAt: null },
      select: { id: true, mimeType: true },
    });
    if (files.length !== uniqueIds.length) {
      throw new NotFoundException("Có ảnh nhận diện không tồn tại.");
    }
    if (
      files.some(
        (file) =>
          !file.mimeType.toLowerCase().startsWith("image/"),
      )
    ) {
      throw new BadRequestException(
        "Ảnh nhận diện phải là ảnh còn hoạt động trong Admin Media.",
      );
    }
  }
}
