import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../../database/prisma/prisma.service";
import { LanguagesService } from "../languages/languages.service";
import type { CreateMonetizationLevelDto } from "./dto/create-monetization-level.dto";
import type { ListMonetizationLevelsQueryDto } from "./dto/list-monetization-levels-query.dto";
import type {
  MonetizationRateDto,
  MonetizationRouteDto,
  MonetizationAdDto,
} from "./dto/monetization-level-config.dto";
import type { UpdateMonetizationLevelDto } from "./dto/update-monetization-level.dto";
import {
  assertMonetizationDefaultCanBeUnset,
  assertMonetizationDefaultPublished,
  assertMonetizationLevelCanDelete,
  assertUniqueMonetizationRates,
  assertUniqueMonetizationRoutes,
  rethrowMonetizationPersistenceError,
} from "./monetization-levels.policy";
import { buildMonetizationLevelsListQuery } from "./queries/monetization-levels-list-query.builder";
import {
  MONETIZATION_LEVEL_INCLUDE,
  MONETIZATION_LEVEL_SUMMARY_SELECT,
  type MonetizationLevelRecord,
} from "./monetization-levels.select";

@Injectable()
export class MonetizationLevelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly languagesService: LanguagesService,
  ) {}

  async findAvailableForMember(userId: number) {
    const [records, user, totalLinks] = await this.prisma.$transaction([
      this.prisma.monetizationLevel.findMany({
        where: { status: "published" },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        include: MONETIZATION_LEVEL_INCLUDE,
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { monetizationLevelId: true },
      }),
      this.prisma.link.count({ where: { userId, deletedAt: null } }),
    ]);
    if (!user) {
      throw new NotFoundException("Không tìm thấy tài khoản.");
    }
    const selectedLevelIsPublished = records.some(
      (record) => record.id === user.monetizationLevelId,
    );
    const defaultLevel = records.find((record) => record.isDefault);
    const effectiveLevelId = selectedLevelIsPublished
      ? user.monetizationLevelId
      : (defaultLevel?.id ?? null);
    const defaultLocale = await this.languagesService.getDefaultLocale();

    return {
      items: records.map((record) => this.toMemberResponse(record)),
      total: records.length,
      selectedLevelId: user.monetizationLevelId,
      effectiveLevelId,
      usesSystemDefault:
        user.monetizationLevelId === null || !selectedLevelIsPublished,
      totalLinks,
      defaultLocale,
    };
  }

  async findPublishedPayoutRates(id: number) {
    const record = await this.prisma.monetizationLevel.findFirst({
      where: { id, status: "published" },
      include: MONETIZATION_LEVEL_INCLUDE,
    });
    if (!record) {
      throw new NotFoundException(
        "Cấp độ kiếm tiền không tồn tại hoặc chưa được xuất bản.",
      );
    }

    const level = this.toMemberResponse(record);
    return {
      levelId: level.id,
      key: level.key,
      profitBps: level.metaData.profitBps,
      rates: level.rates,
    };
  }

  async selectForMember(userId: number, monetizationLevelId: number) {
    const level = await this.prisma.monetizationLevel.findFirst({
      where: { id: monetizationLevelId, status: "published" },
      select: { id: true },
    });
    if (!level) {
      throw new BadRequestException(
        "Cấp độ kiếm tiền không tồn tại hoặc chưa được xuất bản.",
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { monetizationLevelId: level.id },
    });

    return {
      monetizationLevelId: level.id,
      usesSystemDefault: false,
    };
  }

  async findAll(query: ListMonetizationLevelsQueryDto) {
    const { where, orderBy, skip, take, appliedSort, search } =
      buildMonetizationLevelsListQuery(query);
    const [records, total, summaryRecords] = await this.prisma.$transaction([
      this.prisma.monetizationLevel.findMany({
        where,
        orderBy,
        skip,
        take,
        include: MONETIZATION_LEVEL_INCLUDE,
      }),
      this.prisma.monetizationLevel.count({ where }),
      this.prisma.monetizationLevel.findMany({
        where,
        select: MONETIZATION_LEVEL_SUMMARY_SELECT,
      }),
    ]);
    const defaultLocale = await this.languagesService.getDefaultLocale();
    const data = records.map((record) =>
      this.toResponse(record, defaultLocale),
    );
    const pageCount = Math.max(1, Math.ceil(total / query.perPage));

    return {
      data,
      items: data,
      page: query.page,
      perPage: query.perPage,
      limit: query.perPage,
      total,
      pageCount,
      totalPages: pageCount,
      summary: {
        publishedLevels: summaryRecords.filter(
          (record) => record.status === "published",
        ).length,
        configuredRoutes: summaryRecords.reduce(
          (sum, record) =>
            sum + this.parseJson<unknown[]>(record.routesJson, []).length,
          0,
        ),
        configuredRates: summaryRecords.reduce(
          (sum, record) =>
            sum + this.parseJson<unknown[]>(record.ratesJson, []).length,
          0,
        ),
        assignedUsers: summaryRecords.reduce(
          (sum, record) => sum + record._count.users,
          0,
        ),
      },
      sort: appliedSort,
      filters: {
        search: search || null,
        status: query.status || [],
      },
    };
  }

  async findOne(id: number) {
    const [record, defaultLocale] = await Promise.all([
      this.findRecord(id),
      this.languagesService.getDefaultLocale(),
    ]);
    return this.toResponse(record, defaultLocale);
  }

  async create(dto: CreateMonetizationLevelDto) {
    await this.validateConfiguration(dto);
    assertMonetizationDefaultPublished(dto.isDefault, dto.status);

    try {
      const record = await this.prisma.$transaction(async (transaction) => {
        if (dto.isDefault) {
          await transaction.monetizationLevel.updateMany({
            where: { isDefault: true },
            data: { isDefault: false },
          });
        }
        return transaction.monetizationLevel.create({
          data: {
            key: dto.key,
            status: dto.status,
            isDefault: dto.isDefault,
            sortOrder: dto.sortOrder,
            routesJson: this.serializeRoutes(dto.routes),
            ratesJson: JSON.stringify(dto.rates),
            adsJson: JSON.stringify(dto.ads ?? []),
            metaDataJson: JSON.stringify(dto.metaData),
            translations: {
              create: dto.translations.map((translation) => ({
                locale: translation.locale,
                name: translation.name.trim(),
                description: translation.description?.trim() || null,
              })),
            },
          },
          include: MONETIZATION_LEVEL_INCLUDE,
        });
      });
      return this.toResponse(
        record,
        await this.languagesService.getDefaultLocale(),
      );
    } catch (error) {
      rethrowMonetizationPersistenceError(error);
      throw error;
    }
  }

  async update(id: number, dto: UpdateMonetizationLevelDto) {
    const existing = await this.findRecord(id);
    await this.validateConfiguration(dto);

    const nextStatus = dto.status ?? existing.status;
    const nextIsDefault = dto.isDefault ?? existing.isDefault;
    assertMonetizationDefaultPublished(nextIsDefault, nextStatus);
    assertMonetizationDefaultCanBeUnset(existing.isDefault, dto.isDefault);

    try {
      const record = await this.prisma.$transaction(async (transaction) => {
        if (dto.isDefault === true) {
          await transaction.monetizationLevel.updateMany({
            where: { isDefault: true, id: { not: id } },
            data: { isDefault: false },
          });
        }
        return transaction.monetizationLevel.update({
          where: { id },
          data: {
            ...(dto.key !== undefined ? { key: dto.key } : {}),
            ...(dto.status !== undefined ? { status: dto.status } : {}),
            ...(dto.isDefault !== undefined
              ? { isDefault: dto.isDefault }
              : {}),
            ...(dto.sortOrder !== undefined
              ? { sortOrder: dto.sortOrder }
              : {}),
            ...(dto.routes !== undefined
              ? { routesJson: this.serializeRoutes(dto.routes) }
              : {}),
            ...(dto.rates !== undefined
              ? { ratesJson: JSON.stringify(dto.rates) }
              : {}),
            ...(dto.ads !== undefined
              ? { adsJson: JSON.stringify(dto.ads) }
              : {}),
            ...(dto.metaData !== undefined
              ? { metaDataJson: JSON.stringify(dto.metaData) }
              : {}),
            ...(dto.translations !== undefined
              ? {
                  translations: {
                    deleteMany: {},
                    create: dto.translations.map((translation) => ({
                      locale: translation.locale,
                      name: translation.name.trim(),
                      description: translation.description?.trim() || null,
                    })),
                  },
                }
              : {}),
          },
          include: MONETIZATION_LEVEL_INCLUDE,
        });
      });
      return this.toResponse(
        record,
        await this.languagesService.getDefaultLocale(),
      );
    } catch (error) {
      rethrowMonetizationPersistenceError(error);
      throw error;
    }
  }

  async remove(id: number) {
    const existing = await this.findRecord(id);
    assertMonetizationLevelCanDelete({
      isDefault: existing.isDefault,
      usersCount: existing._count.users,
    });
    await this.prisma.monetizationLevel.delete({ where: { id } });
    return { success: true, id };
  }

  private async findRecord(id: number) {
    const record = await this.prisma.monetizationLevel.findUnique({
      where: { id },
      include: MONETIZATION_LEVEL_INCLUDE,
    });
    if (!record) {
      throw new NotFoundException("Không tìm thấy cấp độ kiếm tiền.");
    }
    return record;
  }

  private async validateConfiguration(
    dto: CreateMonetizationLevelDto | UpdateMonetizationLevelDto,
  ) {
    if (dto.translations) {
      const locales = dto.translations.map(({ locale }) => locale);
      await this.languagesService.assertTranslationLocales(locales);
    }
    if (dto.routes) assertUniqueMonetizationRoutes(dto.routes);
    if (dto.rates) {
      assertUniqueMonetizationRates(dto.rates);
    }
    if (dto.ads) this.assertValidAds(dto.ads);
  }

  private toResponse(record: MonetizationLevelRecord, defaultLocale: string) {
    const translations = record.translations.map((translation) => ({
      locale: translation.locale,
      name: translation.name,
      description: translation.description,
    }));
    const preferredTranslation =
      translations.find(({ locale }) => locale === defaultLocale) ??
      translations.find(({ locale }) => locale === defaultLocale.split("-")[0]) ??
      translations.find(({ locale }) => locale === "en") ??
      translations[0];

    return {
      id: record.id,
      key: record.key,
      displayName: preferredTranslation?.name ?? record.key,
      status: record.status,
      isDefault: record.isDefault,
      sortOrder: record.sortOrder,
      translations,
      routes: this.parseRoutes(record.routesJson),
      rates: this.parseJson(record.ratesJson, []),
      ads: this.parseJson(record.adsJson, []),
      metaData: this.parseJson(record.metaDataJson, {
        version: 1,
        profitBps: 0,
        stepCount: 1,
        visitorExperience: {
          popup: "none",
          banner: "none",
          interstitial: "none",
          notification: "none",
        },
      }),
      usersCount: record._count.users,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  private toMemberResponse(record: MonetizationLevelRecord) {
    const translations = record.translations.map((translation) => ({
      locale: translation.locale,
      name: translation.name,
      description: translation.description,
    }));
    const rates = this.parseJson<MonetizationRateDto[]>(record.ratesJson, [])
      .filter((rate) => rate.enabled)
      .map((rate) => ({
        countryCode: rate.countryCode,
        deviceType: rate.deviceType,
        baseCpm: rate.baseCpm,
        currency: rate.currency,
        dailyLimit: rate.dailyLimit ?? null,
      }));

    return {
      id: record.id,
      key: record.key,
      isDefault: record.isDefault,
      sortOrder: record.sortOrder,
      translations,
      rates,
      metaData: this.parseJson(record.metaDataJson, {
        version: 1,
        profitBps: 0,
        stepCount: 1,
        visitorExperience: {
          popup: "none",
          banner: "none",
          interstitial: "none",
          notification: "none",
        },
      }),
    };
  }

  private parseJson<T>(value: string, fallback: T): T {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  private parseRoutes(value: string): MonetizationRouteDto[] {
    return this.parseJson<MonetizationRouteDto[]>(value, []).map((route) => ({
      ...route,
      countryMode: route.countryMode === "exclude" ? "exclude" : "include",
      deviceMode: route.deviceMode === "exclude" ? "exclude" : "include",
      browserMode: route.browserMode === "exclude" ? "exclude" : "include",
    }));
  }

  private serializeRoutes(routes: MonetizationRouteDto[]) {
    return JSON.stringify(
      routes.map((route) => ({
        ...route,
        countryMode: route.countryMode === "exclude" ? "exclude" : "include",
        deviceMode: route.deviceMode === "exclude" ? "exclude" : "include",
        browserMode: route.browserMode === "exclude" ? "exclude" : "include",
      })),
    );
  }

  private assertValidAds(ads: MonetizationAdDto[]) {
    const ids = new Set<string>();
    const deliveryIds = new Set(ads.map((ad) => ad.id));
    for (const ad of ads) {
      if (ids.has(ad.id)) {
        throw new BadRequestException(`ID quảng cáo bị trùng: ${ad.id}.`);
      }
      ids.add(ad.id);
      if (ad.placements.length === 0) {
        throw new BadRequestException(`Quảng cáo ${ad.id} cần ít nhất một placement.`);
      }
      if (
        ad.format === "smartlink" &&
        !ad.content.targetUrl &&
        !ad.content.smartlinks?.length
      ) {
        throw new BadRequestException(
          `Quảng cáo ${ad.id} cần ít nhất một Smartlink.`,
        );
      }
      if (
        ad.format === "smartlink" &&
        (ad.placements.length !== 1 ||
          (ad.placements[0] !== "unlock_redirect" &&
            ad.placements[0] !== "popunder"))
      ) {
        throw new BadRequestException(
          `Smartlink ${ad.id} chỉ hỗ trợ placement unlock_redirect hoặc popunder.`,
        );
      }
      if (ad.format === "smartlink" && ad.content.smartlinks?.length) {
        for (const smartlink of ad.content.smartlinks) {
          if (deliveryIds.has(smartlink.id)) {
            throw new BadRequestException(
              `ID Smartlink bị trùng hoặc trùng ID quảng cáo: ${smartlink.id}.`,
            );
          }
          deliveryIds.add(smartlink.id);
          if (
            smartlink.overrides?.startAt &&
            smartlink.overrides.endAt &&
            Date.parse(smartlink.overrides.endAt) <=
              Date.parse(smartlink.overrides.startAt)
          ) {
            throw new BadRequestException(
              `Smartlink ${smartlink.id} cần thời gian override kết thúc sau thời gian bắt đầu.`,
            );
          }
        }
      }
      if (
        ad.format === "smartlink" &&
        ad.content.startAt &&
        ad.content.endAt &&
        Date.parse(ad.content.endAt) <= Date.parse(ad.content.startAt)
      ) {
        throw new BadRequestException(
          `Smartlink ${ad.id} cần thời gian kết thúc sau thời gian bắt đầu.`,
        );
      }
      if (
        ad.format !== "smartlink" &&
        ad.placements.some(
          (placement) =>
            placement === "unlock_redirect" || placement === "popunder",
        )
      ) {
        throw new BadRequestException(
          `Placement unlock_redirect và popunder chỉ dành cho Smartlink.`,
        );
      }
      if (ad.format === "banner" && (!ad.content.imageUrl || !ad.content.clickUrl)) {
        throw new BadRequestException(`Banner ${ad.id} cần Image URL và Click URL.`);
      }
      if (ad.format === "script" && (!ad.content.adapter || !ad.content.scriptUrl)) {
        throw new BadRequestException(`Script ${ad.id} cần adapter và Script URL.`);
      }
    }
  }
}
