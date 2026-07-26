import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";
import { LanguagesService } from "../languages/languages.service";
import type { CreateMonetizationLevelDto } from "./dto/create-monetization-level.dto";
import type { ListMonetizationLevelsQueryDto } from "./dto/list-monetization-levels-query.dto";
import type {
  MonetizationRateDto,
  MonetizationRouteDto,
} from "./dto/monetization-level-config.dto";
import type { UpdateMonetizationLevelDto } from "./dto/update-monetization-level.dto";

const levelInclude = {
  translations: {
    orderBy: { locale: "asc" },
  },
  _count: {
    select: { users: true },
  },
} satisfies Prisma.MonetizationLevelInclude;

type LevelRecord = Prisma.MonetizationLevelGetPayload<{
  include: typeof levelInclude;
}>;

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
        include: levelInclude,
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
      include: levelInclude,
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
    const search = (query.name || query.search)?.trim();
    const where: Prisma.MonetizationLevelWhereInput = {
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
        }) satisfies Prisma.MonetizationLevelOrderByWithRelationInput,
    );
    const skip = (query.page - 1) * query.perPage;
    const [records, total, summaryRecords] = await this.prisma.$transaction([
      this.prisma.monetizationLevel.findMany({
        where,
        orderBy,
        skip,
        take: query.perPage,
        include: levelInclude,
      }),
      this.prisma.monetizationLevel.count({ where }),
      this.prisma.monetizationLevel.findMany({
        where,
        select: {
          status: true,
          routesJson: true,
          ratesJson: true,
          _count: { select: { users: true } },
        },
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
    this.assertDefaultIsPublished(dto.isDefault, dto.status);

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
            metaDataJson: JSON.stringify(dto.metaData),
            translations: {
              create: dto.translations.map((translation) => ({
                locale: translation.locale,
                name: translation.name.trim(),
                description: translation.description?.trim() || null,
              })),
            },
          },
          include: levelInclude,
        });
      });
      return this.toResponse(
        record,
        await this.languagesService.getDefaultLocale(),
      );
    } catch (error) {
      this.rethrowKnownError(error);
      throw error;
    }
  }

  async update(id: number, dto: UpdateMonetizationLevelDto) {
    const existing = await this.findRecord(id);
    await this.validateConfiguration(dto);

    const nextStatus = dto.status ?? existing.status;
    const nextIsDefault = dto.isDefault ?? existing.isDefault;
    this.assertDefaultIsPublished(nextIsDefault, nextStatus);
    if (existing.isDefault && dto.isDefault === false) {
      throw new BadRequestException(
        "Hãy đặt một cấp độ khác làm mặc định trước khi bỏ cấp độ hiện tại.",
      );
    }

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
          include: levelInclude,
        });
      });
      return this.toResponse(
        record,
        await this.languagesService.getDefaultLocale(),
      );
    } catch (error) {
      this.rethrowKnownError(error);
      throw error;
    }
  }

  async remove(id: number) {
    const existing = await this.findRecord(id);
    if (existing.isDefault) {
      throw new BadRequestException(
        "Không thể xóa cấp độ mặc định. Hãy chọn cấp độ mặc định khác trước.",
      );
    }
    if (existing._count.users > 0) {
      throw new ConflictException(
        "Cấp độ đang được người dùng lựa chọn. Hãy lưu trữ thay vì xóa.",
      );
    }
    await this.prisma.monetizationLevel.delete({ where: { id } });
    return { success: true, id };
  }

  private async findRecord(id: number) {
    const record = await this.prisma.monetizationLevel.findUnique({
      where: { id },
      include: levelInclude,
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
    if (dto.routes) this.assertUniqueRoutes(dto.routes);
    if (dto.rates) {
      this.assertUniqueRates(dto.rates);
      for (const rate of dto.rates) {
        if (rate.enabled && Number(rate.baseCpm) <= 0) {
          throw new BadRequestException(
            "Base CPM của rate đang bật phải lớn hơn 0.",
          );
        }
      }
    }
  }

  private assertUniqueRoutes(routes: MonetizationRouteDto[]) {
    const ids = routes.map(({ id }) => id);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException("Route id không được trùng nhau.");
    }
    if (
      routes.some(
        (route) =>
          route.countryMode === "exclude" && route.countryCode === "ALL",
      )
    ) {
      throw new BadRequestException(
        'Route không thể dùng chế độ "exclude" với tất cả quốc gia.',
      );
    }
    if (
      routes.some(
        (route) =>
          route.deviceMode === "exclude" && route.deviceType === "any",
      )
    ) {
      throw new BadRequestException(
        'Route không thể dùng chế độ "exclude" với mọi thiết bị.',
      );
    }
    if (
      routes.some(
        (route) =>
          route.browserMode === "exclude" && route.browserFamily === "any",
      )
    ) {
      throw new BadRequestException(
        'Route không thể dùng chế độ "exclude" với mọi trình duyệt.',
      );
    }
  }

  private assertUniqueRates(rates: MonetizationRateDto[]) {
    const keys = rates.map(
      ({ countryCode, deviceType }) => `${countryCode}:${deviceType}`,
    );
    if (new Set(keys).size !== keys.length) {
      throw new BadRequestException(
        "Mỗi tổ hợp quốc gia và thiết bị chỉ được có một rate.",
      );
    }
  }

  private assertDefaultIsPublished(isDefault: boolean, status: string) {
    if (isDefault && status !== "published") {
      throw new BadRequestException(
        "Cấp độ mặc định phải ở trạng thái xuất bản.",
      );
    }
  }

  private toResponse(record: LevelRecord, defaultLocale: string) {
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

  private toMemberResponse(record: LevelRecord) {
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

  private rethrowKnownError(error: unknown): never | void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictException("Key hoặc locale của cấp độ đã tồn tại.");
    }
  }
}
