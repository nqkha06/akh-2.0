import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";
import { LanguagesService } from "../languages/languages.service";
import { BusinessSettingsService } from "../business-settings/business-settings.service";
import type { CreateLoyaltyTierDto } from "./dto/create-loyalty-tier.dto";
import type { ListLoyaltyTiersQueryDto } from "./dto/list-loyalty-tiers-query.dto";
import type { LoyaltyTierTranslationDto } from "./dto/loyalty-tier-config.dto";
import type { UpdateLoyaltyTierDto } from "./dto/update-loyalty-tier.dto";

const DAY_MS = 86_400_000;

const loyaltyTierInclude = {
  translations: { orderBy: { locale: "asc" as const } },
} satisfies Prisma.LoyaltyTierInclude;

type LoyaltyTierRecord = Prisma.LoyaltyTierGetPayload<{
  include: typeof loyaltyTierInclude;
}>;

type LoyaltyBenefit = {
  key: string;
  label: string;
  included: boolean;
  value: string | null;
};

type LocalizedTier = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  minimumValidViews: number;
  sortOrder: number;
  iconKey: string | null;
  benefits: LoyaltyBenefit[];
};

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly languagesService: LanguagesService,
    private readonly businessSettings: BusinessSettingsService,
  ) {}

  async findAllTiers(query: ListLoyaltyTiersQueryDto) {
    const search = (query.name || query.search)?.trim();
    const where: Prisma.LoyaltyTierWhereInput = {
      ...(query.status?.length ? { status: { in: query.status } } : {}),
      ...(search
        ? {
            OR: [
              { key: { contains: search } },
              { translations: { some: { name: { contains: search } } } },
            ],
          }
        : {}),
    };
    const appliedSort = query.sort?.length
      ? query.sort
      : [{ id: query.sortBy, desc: query.sortOrder === "desc" }];
    const orderBy = appliedSort.map(
      (sort) =>
        ({
          [sort.id]: sort.desc ? "desc" : "asc",
        }) satisfies Prisma.LoyaltyTierOrderByWithRelationInput,
    );
    const skip = (query.page - 1) * query.perPage;
    const [records, total, summaryRecords, defaultLocale] = await Promise.all([
      this.prisma.loyaltyTier.findMany({
        where,
        orderBy,
        skip,
        take: query.perPage,
        include: loyaltyTierInclude,
      }),
      this.prisma.loyaltyTier.count({ where }),
      this.prisma.loyaltyTier.findMany({
        where,
        select: {
          status: true,
          minimumValidViews: true,
          translations: { select: { benefitsJson: true } },
        },
      }),
      this.languagesService.getDefaultLocale(),
    ]);
    const items = records.map((record) =>
      this.toAdminResponse(record, defaultLocale),
    );
    const pageCount = Math.max(1, Math.ceil(total / query.perPage));

    return {
      data: items,
      items,
      page: query.page,
      perPage: query.perPage,
      limit: query.perPage,
      total,
      pageCount,
      totalPages: pageCount,
      summary: {
        publishedTiers: summaryRecords.filter(
          (record) => record.status === "published",
        ).length,
        configuredBenefits: summaryRecords.reduce(
          (sum, record) =>
            sum +
            Math.max(
              0,
              ...record.translations.map(
                (translation) =>
                  this.parseBenefits(translation.benefitsJson, "summary")
                    .length,
              ),
            ),
          0,
        ),
        highestThreshold: Math.max(
          0,
          ...summaryRecords.map((record) => record.minimumValidViews),
        ),
      },
      sort: appliedSort,
      filters: {
        search: search || null,
        status: query.status || [],
      },
    };
  }

  async findOneTier(id: number) {
    const [record, defaultLocale] = await Promise.all([
      this.findTierRecord(id),
      this.languagesService.getDefaultLocale(),
    ]);
    return this.toAdminResponse(record, defaultLocale);
  }

  async createTier(dto: CreateLoyaltyTierDto) {
    await this.validateTierConfiguration(dto.translations);
    await this.assertThresholdAvailable(dto.minimumValidViews);

    try {
      const record = await this.prisma.loyaltyTier.create({
        data: {
          key: dto.key,
          minimumValidViews: dto.minimumValidViews,
          sortOrder: dto.sortOrder,
          iconKey: dto.iconKey ?? null,
          status: dto.status,
          translations: {
            create: dto.translations.map((translation) =>
              this.translationCreateData(translation),
            ),
          },
        },
        include: loyaltyTierInclude,
      });
      return this.toAdminResponse(
        record,
        await this.languagesService.getDefaultLocale(),
      );
    } catch (error) {
      this.rethrowKnownError(error);
      throw error;
    }
  }

  async updateTier(id: number, dto: UpdateLoyaltyTierDto) {
    await this.findTierRecord(id);
    if (dto.translations) {
      await this.validateTierConfiguration(dto.translations);
    }
    if (dto.minimumValidViews !== undefined) {
      await this.assertThresholdAvailable(dto.minimumValidViews, id);
    }

    try {
      const record = await this.prisma.loyaltyTier.update({
        where: { id },
        data: {
          ...(dto.key !== undefined ? { key: dto.key } : {}),
          ...(dto.minimumValidViews !== undefined
            ? { minimumValidViews: dto.minimumValidViews }
            : {}),
          ...(dto.sortOrder !== undefined
            ? { sortOrder: dto.sortOrder }
            : {}),
          ...(dto.iconKey !== undefined ? { iconKey: dto.iconKey } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(dto.translations !== undefined
            ? {
                translations: {
                  deleteMany: {},
                  create: dto.translations.map((translation) =>
                    this.translationCreateData(translation),
                  ),
                },
              }
            : {}),
        },
        include: loyaltyTierInclude,
      });
      return this.toAdminResponse(
        record,
        await this.languagesService.getDefaultLocale(),
      );
    } catch (error) {
      this.rethrowKnownError(error);
      throw error;
    }
  }

  async removeTier(id: number) {
    await this.findTierRecord(id);
    await this.prisma.loyaltyTier.delete({ where: { id } });
    return { success: true, id };
  }

  async getMemberOverview(userId: number, requestedLocale?: string) {
    const settings = await this.businessSettings.getRuntime();
    const loyaltyWindowDays = settings.loyaltyWindowDays;
    const loyaltyHistoryDays = settings.loyaltyHistoryDays;
    const records = await this.prisma.loyaltyTier.findMany({
      where: { status: "published" },
      include: loyaltyTierInclude,
      orderBy: [{ minimumValidViews: "asc" }, { sortOrder: "asc" }],
    });
    const tiers = records.map((tier) =>
      this.localizeTier(tier, requestedLocale),
    );

    const today = this.startOfUtcDay(new Date());
    const metricDayCount = loyaltyWindowDays + loyaltyHistoryDays - 1;
    const metricDays = Array.from({ length: metricDayCount }, (_, index) =>
      this.addUtcDays(today, index - metricDayCount + 1),
    );

    const [dailyCounts, latestAggregation, loyaltySnapshot] = await Promise.all([
      this.prisma.$transaction(
        metricDays.map((day) =>
          this.prisma.linkAccessLog.count({
            where: {
              userId,
              isEarn: true,
              completedAt: {
                gte: day,
                lt: this.addUtcDays(day, 1),
              },
            },
          }),
        ),
      ),
      this.prisma.linkAccessLog.aggregate({
        where: { userId, isEarn: true },
        _max: { processedAt: true },
      }),
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          loyaltyTierId: true,
          loyaltyValidViews: true,
          loyaltyWindowStartedAt: true,
          loyaltyWindowEndedAt: true,
          loyaltyCalculatedAt: true,
        },
      }),
    ]);

    const history = metricDays
      .slice(loyaltyWindowDays - 1)
      .map((day, historyIndex) => {
        const metricIndex = historyIndex + loyaltyWindowDays - 1;
        const rollingValidViews = dailyCounts
          .slice(metricIndex - loyaltyWindowDays + 1, metricIndex + 1)
          .reduce((total, count) => total + count, 0);
        const tier = this.resolveTier(tiers, rollingValidViews);

        return {
          date: day.toISOString().slice(0, 10),
          dailyValidViews: dailyCounts[metricIndex] ?? 0,
          rollingValidViews,
          tier: tier ? { key: tier.key, name: tier.name } : null,
        };
      });

    const liveCurrentValue = history[history.length - 1]?.rollingValidViews ?? 0;
    const hasDailySnapshot = loyaltySnapshot.loyaltyCalculatedAt !== null;
    const currentValue = hasDailySnapshot
      ? loyaltySnapshot.loyaltyValidViews
      : liveCurrentValue;
    const currentTier = hasDailySnapshot
      ? tiers.find((tier) => tier.id === loyaltySnapshot.loyaltyTierId) ??
        this.resolveTier(tiers, currentValue)
      : this.resolveTier(tiers, currentValue);
    const currentTierIndex = currentTier
      ? tiers.findIndex((tier) => tier.id === currentTier.id)
      : -1;
    const nextTier = tiers[currentTierIndex + 1] ?? null;

    return {
      calculation: {
        metric: "earned_views",
        windowDays: loyaltyWindowDays,
        timezone: "UTC",
        lastAggregatedAt: latestAggregation._max.processedAt,
        lastRankedAt: loyaltySnapshot.loyaltyCalculatedAt,
        windowStartedAt: loyaltySnapshot.loyaltyWindowStartedAt,
        windowEndedAt: loyaltySnapshot.loyaltyWindowEndedAt,
        source: hasDailySnapshot ? "daily_rollup" : "live_fallback",
      },
      summary: {
        currentValue,
        currentTier: currentTier
          ? { key: currentTier.key, name: currentTier.name }
          : null,
        nextTier: nextTier ? { key: nextTier.key, name: nextTier.name } : null,
        nextTierTarget: nextTier?.minimumValidViews ?? null,
        remaining: nextTier
          ? Math.max(0, nextTier.minimumValidViews - currentValue)
          : 0,
        progress: this.progress(currentTier, nextTier, currentValue),
      },
      tiers: tiers.map((tier) => ({
        ...tier,
        isCurrent: tier.id === currentTier?.id,
        isNext: tier.id === nextTier?.id,
      })),
      history,
    };
  }

  private localizeTier(
    tier: LoyaltyTierRecord,
    requestedLocale?: string,
  ): LocalizedTier {
    const locale = requestedLocale?.trim().toLowerCase() || "vi";
    const language = locale.split("-")[0];
    const translation =
      tier.translations.find(
        (item) => item.locale.toLowerCase() === locale,
      ) ??
      tier.translations.find(
        (item) => item.locale.toLowerCase() === language,
      ) ??
      tier.translations.find((item) => item.locale === "vi") ??
      tier.translations.find((item) => item.locale === "en") ??
      tier.translations[0];

    return {
      id: tier.id,
      key: tier.key,
      name: translation?.name ?? tier.key,
      description: translation?.description ?? null,
      minimumValidViews: tier.minimumValidViews,
      sortOrder: tier.sortOrder,
      iconKey: tier.iconKey,
      benefits: this.parseBenefits(
        translation?.benefitsJson ?? "[]",
        tier.key,
      ),
    };
  }

  private async findTierRecord(id: number) {
    const record = await this.prisma.loyaltyTier.findUnique({
      where: { id },
      include: loyaltyTierInclude,
    });
    if (!record) {
      throw new NotFoundException("Không tìm thấy hạng Loyalty.");
    }
    return record;
  }

  private async validateTierConfiguration(
    translations: LoyaltyTierTranslationDto[],
  ) {
    const locales = translations.map(({ locale }) => locale);
    if (new Set(locales).size !== locales.length) {
      throw new BadRequestException("Locale bản dịch không được trùng nhau.");
    }
    await this.languagesService.assertTranslationLocales(locales);

    const expectedSignature = translations[0]?.benefits.map(
      (benefit) => `${benefit.key}:${benefit.included ? "1" : "0"}`,
    );
    for (const translation of translations) {
      if (!translation.name.trim()) {
        throw new BadRequestException("Tên hạng Loyalty không được để trống.");
      }
      const keys = translation.benefits.map(({ key }) => key);
      if (new Set(keys).size !== keys.length) {
        throw new BadRequestException(
          `Key quyền lợi trong locale ${translation.locale} không được trùng nhau.`,
        );
      }
      if (translation.benefits.some(({ label }) => !label.trim())) {
        throw new BadRequestException(
          `Tên quyền lợi trong locale ${translation.locale} không được để trống.`,
        );
      }
      const signature = translation.benefits.map(
        (benefit) => `${benefit.key}:${benefit.included ? "1" : "0"}`,
      );
      if (signature.join("|") !== expectedSignature?.join("|")) {
        throw new BadRequestException(
          "Thứ tự, key và trạng thái tích/X của quyền lợi phải giống nhau giữa các bản dịch.",
        );
      }
    }
  }

  private async assertThresholdAvailable(value: number, excludingId?: number) {
    const duplicate = await this.prisma.loyaltyTier.findFirst({
      where: {
        minimumValidViews: value,
        ...(excludingId ? { id: { not: excludingId } } : {}),
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictException(
        "Đã có một hạng Loyalty sử dụng ngưỡng lượt xem này.",
      );
    }
  }

  private translationCreateData(translation: LoyaltyTierTranslationDto) {
    return {
      locale: translation.locale,
      name: translation.name.trim(),
      description: translation.description?.trim() || null,
      benefitsJson: JSON.stringify(
        translation.benefits.map((benefit) => ({
          key: benefit.key,
          label: benefit.label.trim(),
          included: benefit.included,
          value: benefit.value?.trim() || null,
        })),
      ),
    };
  }

  private toAdminResponse(record: LoyaltyTierRecord, defaultLocale: string) {
    const translations = record.translations.map((translation) => ({
      locale: translation.locale,
      name: translation.name,
      description: translation.description,
      benefits: this.parseBenefits(translation.benefitsJson, record.key),
    }));
    const preferredTranslation =
      translations.find(({ locale }) => locale === defaultLocale) ??
      translations.find(
        ({ locale }) => locale === defaultLocale.split("-")[0],
      ) ??
      translations.find(({ locale }) => locale === "vi") ??
      translations.find(({ locale }) => locale === "en") ??
      translations[0];

    return {
      id: record.id,
      key: record.key,
      displayName: preferredTranslation?.name ?? record.key,
      minimumValidViews: record.minimumValidViews,
      sortOrder: record.sortOrder,
      iconKey: record.iconKey,
      status: record.status,
      translations,
      benefitsCount: preferredTranslation?.benefits.length ?? 0,
      includedBenefitsCount:
        preferredTranslation?.benefits.filter(({ included }) => included)
          .length ?? 0,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  private rethrowKnownError(error: unknown): never | void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictException("Key hoặc locale của hạng đã tồn tại.");
    }
  }

  private parseBenefits(value: string, tierKey: string): LoyaltyBenefit[] {
    try {
      const parsed: unknown = JSON.parse(value);
      if (!Array.isArray(parsed)) return [];

      return parsed.flatMap((item): LoyaltyBenefit[] => {
        if (!item || typeof item !== "object") return [];
        const candidate = item as Record<string, unknown>;
        if (
          typeof candidate.key !== "string" ||
          typeof candidate.label !== "string" ||
          typeof candidate.included !== "boolean"
        ) {
          return [];
        }
        return [
          {
            key: candidate.key,
            label: candidate.label,
            included: candidate.included,
            value:
              typeof candidate.value === "string" ? candidate.value : null,
          },
        ];
      });
    } catch {
      this.logger.warn(`Invalid benefits JSON for loyalty tier ${tierKey}.`);
      return [];
    }
  }

  private resolveTier(tiers: LocalizedTier[], value: number) {
    let resolved: LocalizedTier | null = null;
    for (const tier of tiers) {
      if (value < tier.minimumValidViews) break;
      resolved = tier;
    }
    return resolved;
  }

  private progress(
    currentTier: LocalizedTier | null,
    nextTier: LocalizedTier | null,
    value: number,
  ) {
    if (!nextTier) return currentTier ? 100 : 0;
    const start = currentTier?.minimumValidViews ?? 0;
    const range = nextTier.minimumValidViews - start;
    if (range <= 0) return 100;
    return Math.min(100, Math.max(0, Math.round(((value - start) / range) * 100)));
  }

  private startOfUtcDay(value: Date) {
    return new Date(
      Date.UTC(
        value.getUTCFullYear(),
        value.getUTCMonth(),
        value.getUTCDate(),
      ),
    );
  }

  private addUtcDays(value: Date, days: number) {
    return new Date(value.getTime() + days * DAY_MS);
  }
}
