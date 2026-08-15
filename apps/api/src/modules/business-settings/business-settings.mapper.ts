import type { BusinessSettings, Prisma } from "@prisma/client";
import {
  BUNDLED_UI_LOCALES,
  DEFAULT_BACKGROUND_IMAGE_PRESETS,
  DEFAULT_BACKGROUND_VIDEO_PRESETS,
  DEFAULT_UPLOAD_MIME_TYPES,
  type BackgroundImagePreset,
  type BackgroundVideoPreset,
} from "@stu/contracts";

import type { UpdateBusinessSettingsDto } from "./dto/update-business-settings.dto";
import type { BusinessCurrencyRecord } from "./business-settings.select";

export type RuntimeBusinessSettings = ReturnType<
  typeof mapRuntimeBusinessSettings
>;

export function mapRuntimeBusinessSettings(settings: BusinessSettings) {
  return {
    version: settings.version,
    registrationEnabled: settings.registrationEnabled,
    emailVerificationRequired: settings.emailVerificationRequired,
    googleLoginEnabled: settings.googleLoginEnabled,
    baseCurrencyCode: settings.baseCurrencyCode,
    withdrawalCurrencyCode: settings.withdrawalCurrencyCode,
    referralCommissionRate: settings.referralCommissionRate,
    loyaltyWindowDays: settings.loyaltyWindowDays,
    loyaltyHistoryDays: settings.loyaltyHistoryDays,
    memberFileMaxBytes: Number(settings.memberFileMaxBytes),
    coverImageMaxBytes: Number(settings.coverImageMaxBytes),
    adminMediaMaxBytes: Number(settings.adminMediaMaxBytes),
    supportAttachmentMaxBytes: Number(settings.supportAttachmentMaxBytes),
    memberStorageQuotaBytes: Number(settings.memberStorageQuotaBytes),
    uploadAllowedMimeTypes: parseStringArray(
      settings.uploadAllowedMimeTypesJson,
      [...DEFAULT_UPLOAD_MIME_TYPES],
    ),
    backgroundImages: parseBackgroundImages(settings.backgroundImagesJson),
    backgroundVideos: parseBackgroundVideos(settings.backgroundVideosJson),
    maintenanceMode: settings.maintenanceMode,
    withdrawalsPaused: settings.withdrawalsPaused,
  };
}

export function mapAdminBusinessSettings(
  settings: BusinessSettings,
  currencies: BusinessCurrencyRecord[],
) {
  const runtime = mapRuntimeBusinessSettings(settings);
  return {
    ...runtime,
    referralCommissionRate: runtime.referralCommissionRate.toFixed(2),
    updatedAt: settings.updatedAt.toISOString(),
    currencies: currencies.map((currency) => ({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      exchangeRate: currency.exchangeRate.toString(),
      isBase: currency.isBase,
      isDefault: currency.isDefault,
      isActive: currency.isActive,
    })),
    uiLanguages: {
      bundled: [...BUNDLED_UI_LOCALES],
      source: "published-languages",
      fallbackLocale: "en",
    },
  };
}

export function mapPublicBusinessSettings(settings: RuntimeBusinessSettings) {
  return {
    version: settings.version,
    authentication: {
      registrationEnabled: settings.registrationEnabled,
      googleLoginEnabled: settings.googleLoginEnabled,
    },
    operations: {
      maintenanceMode: settings.maintenanceMode,
      withdrawalsPaused: settings.withdrawalsPaused,
    },
    uploads: {
      memberFileMaxBytes: settings.memberFileMaxBytes,
      coverImageMaxBytes: settings.coverImageMaxBytes,
      allowedMimeTypes: settings.uploadAllowedMimeTypes,
    },
    presetLibrary: {
      images: settings.backgroundImages.filter((preset) => preset.enabled),
      videos: settings.backgroundVideos.filter((preset) => preset.enabled),
    },
  };
}

export function buildBusinessSettingsUpdate(
  dto: UpdateBusinessSettingsDto,
  referralCommissionRate: Prisma.Decimal,
  adminId: number,
) {
  return {
    registrationEnabled: dto.registrationEnabled,
    emailVerificationRequired: dto.emailVerificationRequired,
    googleLoginEnabled: dto.googleLoginEnabled,
    baseCurrencyCode: dto.baseCurrencyCode,
    withdrawalCurrencyCode: dto.withdrawalCurrencyCode,
    referralCommissionRate,
    loyaltyWindowDays: dto.loyaltyWindowDays,
    loyaltyHistoryDays: dto.loyaltyHistoryDays,
    memberFileMaxBytes: BigInt(dto.memberFileMaxBytes),
    coverImageMaxBytes: BigInt(dto.coverImageMaxBytes),
    adminMediaMaxBytes: BigInt(dto.adminMediaMaxBytes),
    supportAttachmentMaxBytes: BigInt(dto.supportAttachmentMaxBytes),
    memberStorageQuotaBytes: BigInt(dto.memberStorageQuotaBytes),
    uploadAllowedMimeTypesJson: JSON.stringify(
      [...new Set(dto.uploadAllowedMimeTypes)].sort(),
    ),
    backgroundImagesJson: JSON.stringify(dto.backgroundImages),
    backgroundVideosJson: JSON.stringify(dto.backgroundVideos),
    maintenanceMode: dto.maintenanceMode,
    withdrawalsPaused: dto.withdrawalsPaused,
    updatedById: adminId,
  } satisfies Prisma.BusinessSettingsUncheckedUpdateInput;
}

export function parseStringArray(value: string, fallback: string[]) {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) &&
      parsed.length > 0 &&
      parsed.every((item) => typeof item === "string")
      ? parsed
      : fallback;
  } catch {
    return fallback;
  }
}

function parseBackgroundImages(value: string): BackgroundImagePreset[] {
  return parsePresetArray(value, DEFAULT_BACKGROUND_IMAGE_PRESETS, (item) => {
    if (!isRecord(item)) return null;
    const base = parsePresetBase(item);
    if (!base || typeof item.imageUrl !== "string") return null;
    return { ...base, imageUrl: item.imageUrl };
  });
}

function parseBackgroundVideos(value: string): BackgroundVideoPreset[] {
  return parsePresetArray(value, DEFAULT_BACKGROUND_VIDEO_PRESETS, (item) => {
    if (!isRecord(item)) return null;
    const base = parsePresetBase(item);
    if (
      !base ||
      typeof item.source !== "string" ||
      typeof item.sourceUrl !== "string" ||
      typeof item.videoUrl !== "string"
    ) {
      return null;
    }
    return {
      ...base,
      source: item.source,
      sourceUrl: item.sourceUrl,
      videoUrl: item.videoUrl,
    };
  });
}

function parsePresetArray<T>(
  value: string,
  fallback: T[],
  parseItem: (item: unknown) => T | null,
) {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.length === 0) return fallback;
    const items = parsed.map(parseItem);
    return items.every((item): item is T => item !== null) ? items : fallback;
  } catch {
    return fallback;
  }
}

function parsePresetBase(item: Record<string, unknown>) {
  if (
    typeof item.id !== "string" ||
    typeof item.name !== "string" ||
    typeof item.enabled !== "boolean" ||
    !Array.isArray(item.categories) ||
    !item.categories.every((category) => typeof category === "string")
  ) {
    return null;
  }
  return {
    id: item.id,
    name: item.name,
    categories: item.categories,
    enabled: item.enabled,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
