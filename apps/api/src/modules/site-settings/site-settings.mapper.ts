import {
  SOCIAL_PLATFORMS,
  type UpdateWebsiteSettingsDto,
  type WebsiteSocialLinkDto,
} from "./dto/update-website-settings.dto";
import type {
  WebsiteSettingsMedia,
  WebsiteSettingsRecord,
} from "./site-settings.select";

export function mapAdminWebsiteSettings(settings: WebsiteSettingsRecord) {
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
    branding: mapWebsiteBranding(settings),
    socialLinks: parseWebsiteSocialLinks(settings.socialLinksJson),
    contactEmail: settings.contactEmail,
    supportEmail: settings.supportEmail,
    phone: settings.phone,
    address: settings.address,
    workingHours: settings.workingHours,
    mapUrl: settings.mapUrl,
    updatedAt: settings.updatedAt,
  };
}

export function mapPublicWebsiteSettings(settings: WebsiteSettingsRecord) {
  return {
    siteName: settings.siteName,
    siteShortName: settings.siteShortName,
    siteDescription: settings.siteDescription,
    siteTagline: settings.siteTagline,
    siteUrl: settings.siteUrl,
    branding: mapWebsiteBranding(settings),
    socialLinks: parseWebsiteSocialLinks(settings.socialLinksJson)
      .filter((link) => link.isActive)
      .sort((left, right) => left.sortOrder - right.sortOrder),
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

export function buildWebsiteSettingsPersistence(
  dto: UpdateWebsiteSettingsDto,
) {
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
      [...dto.socialLinks].sort((left, right) => left.sortOrder - right.sortOrder),
    ),
    contactEmail: dto.contactEmail ?? null,
    supportEmail: dto.supportEmail ?? null,
    phone: dto.phone ?? null,
    address: dto.address ?? null,
    workingHours: dto.workingHours ?? null,
    mapUrl: dto.mapUrl ?? null,
  };
}

export function parseWebsiteSocialLinks(value: string): WebsiteSocialLinkDto[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!isRecord(item)) return [];
      const platform = SOCIAL_PLATFORMS.find(
        (candidate) => candidate === item.platform,
      );
      const sortOrder = item.sortOrder;
      if (
        !platform ||
        typeof item.url !== "string" ||
        !item.url.startsWith("https://") ||
        typeof item.isActive !== "boolean" ||
        typeof sortOrder !== "number" ||
        !Number.isInteger(sortOrder)
      ) {
        return [];
      }
      return [{
        platform,
        url: item.url,
        isActive: item.isActive,
        sortOrder,
      }];
    });
  } catch {
    return [];
  }
}

function mapWebsiteBranding(settings: WebsiteSettingsRecord) {
  return {
    logoLight: mapPublicWebsiteMedia(settings.logoLight),
    logoDark: mapPublicWebsiteMedia(settings.logoDark),
    logoIcon: mapPublicWebsiteMedia(settings.logoIcon),
    favicon: mapPublicWebsiteMedia(settings.favicon),
    defaultOgImage: mapPublicWebsiteMedia(settings.defaultOgImage),
  };
}

function mapPublicWebsiteMedia(file: WebsiteSettingsMedia | null) {
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
