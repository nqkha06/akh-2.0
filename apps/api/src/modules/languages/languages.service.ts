import {
  ConflictException,
  Injectable,
  NotFoundException,
  type OnModuleInit,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";
import type { CreateLanguageDto } from "./dto/create-language.dto";
import type { ReorderLanguagesDto } from "./dto/reorder-languages.dto";
import type { UpdateLanguageDto } from "./dto/update-language.dto";
import type { UpdateUiTranslationsDto } from "./dto/update-ui-translations.dto";
import {
  mapLanguageResponse,
  parseLanguageUiMessages,
} from "./languages.mapper";
import {
  assertDefaultLanguagePublished,
  assertLanguageUpdateAllowed,
  assertRequiredTranslationLocales,
  assertUniqueLanguageOrder,
  mergeLanguageUiMessages,
} from "./languages.policy";
import { LANGUAGE_RESPONSE_SELECT } from "./languages.select";

@Injectable()
export class LanguagesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const count = await this.prisma.language.count();
    await this.prisma.language.upsert({
      where: { locale: "vi" },
      update: {},
      create: {
        name: "Vietnamese",
        nativeName: "Tiếng Việt",
        locale: "vi",
        code: "vi",
        regional: "vi-VN",
        flag: "VN",
        isDefault: count === 0,
        status: "published",
        sortOrder: 10,
        isRtl: false,
      },
    });
    await this.prisma.language.upsert({
      where: { locale: "en" },
      update: {},
      create: {
        name: "English",
        nativeName: "English",
        locale: "en",
        code: "en",
        regional: "en-US",
        flag: "US",
        status: "published",
        sortOrder: 20,
        isRtl: false,
      },
    });
    const defaultLanguage = await this.prisma.language.findFirst({
      where: { isDefault: true },
      select: { id: true },
    });
    if (!defaultLanguage) {
      await this.prisma.language.update({
        where: { locale: "vi" },
        data: { isDefault: true, status: "published" },
      });
    }
  }

  async findAllForAdmin() {
    const items = await this.prisma.language.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: LANGUAGE_RESPONSE_SELECT,
    });
    return {
      items: items.map((language) => mapLanguageResponse(language, true)),
      total: items.length,
      defaultLocale:
        items.find((language) => language.isDefault)?.locale ?? null,
    };
  }

  async findPublished() {
    const items = await this.prisma.language.findMany({
      where: { status: "published" },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: LANGUAGE_RESPONSE_SELECT,
    });
    return {
      items: items.map((language) => mapLanguageResponse(language, false)),
      defaultLocale:
        items.find((language) => language.isDefault)?.locale ??
        items[0]?.locale ??
        null,
    };
  }

  async findOne(id: number) {
    const language = await this.findRecord(id);
    return mapLanguageResponse(language, true);
  }

  async findUiTranslations(id: number) {
    const language = await this.findRecord(id);
    const messages = parseLanguageUiMessages(language.uiMessagesJson);
    return {
      language: mapLanguageResponse(language, true),
      messages,
      translatedKeys: Object.keys(messages).length,
      catalogSize: language.uiCatalogSize,
      version: language.uiTranslationVersion,
      updatedAt: language.uiUpdatedAt,
    };
  }

  async findPublicUiMessages(locale: string) {
    if (!/^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(locale)) {
      throw new NotFoundException("Không tìm thấy ngôn ngữ.");
    }
    const language = await this.prisma.language.findFirst({
      where: { locale, status: "published" },
      select: LANGUAGE_RESPONSE_SELECT,
    });
    if (!language) throw new NotFoundException("Không tìm thấy ngôn ngữ.");
    return {
      locale: language.locale,
      isRtl: language.isRtl,
      messages: parseLanguageUiMessages(language.uiMessagesJson),
      version: language.uiTranslationVersion,
    };
  }

  async updateUiTranslations(id: number, dto: UpdateUiTranslationsDto) {
    const language = await this.prisma.language.findUnique({
      where: { id },
      select: { id: true, uiMessagesJson: true },
    });
    if (!language) throw new NotFoundException("Không tìm thấy ngôn ngữ.");
    const messages = mergeLanguageUiMessages(language.uiMessagesJson, dto);

    const updated = await this.prisma.language.updateMany({
      where: { id, uiTranslationVersion: dto.version },
      data: {
        uiMessagesJson: JSON.stringify(messages),
        uiCatalogSize: dto.catalogSize,
        uiTranslationVersion: { increment: 1 },
        uiUpdatedAt: new Date(),
      },
    });
    if (!updated.count) {
      throw new ConflictException(
        "Bản dịch vừa được quản trị viên khác cập nhật. Hãy tải lại trang.",
      );
    }
    return this.findUiTranslations(id);
  }

  async create(dto: CreateLanguageDto) {
    assertDefaultLanguagePublished(dto.isDefault, dto.status);
    try {
      const language = await this.prisma.$transaction(async (transaction) => {
        if (dto.isDefault) {
          await transaction.language.updateMany({
            where: { isDefault: true },
            data: { isDefault: false },
          });
        }
        return transaction.language.create({ data: this.normalizeCreate(dto) });
      });
      return this.findOne(language.id);
    } catch (error) {
      this.throwPersistenceError(error);
    }
  }

  async update(id: number, dto: UpdateLanguageDto) {
    const existing = await this.findOne(id);
    assertLanguageUpdateAllowed(existing, dto);
    if (dto.locale && dto.locale !== existing.locale) {
      await this.assertLocaleIsUnused(existing.locale);
    }

    try {
      const language = await this.prisma.$transaction(async (transaction) => {
        if (dto.isDefault === true) {
          await transaction.language.updateMany({
            where: { isDefault: true, id: { not: id } },
            data: { isDefault: false },
          });
        }
        return transaction.language.update({
          where: { id },
          data: {
            ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
            ...(dto.nativeName !== undefined
              ? { nativeName: dto.nativeName.trim() || null }
              : {}),
            ...(dto.locale !== undefined ? { locale: dto.locale } : {}),
            ...(dto.code !== undefined ? { code: dto.code } : {}),
            ...(dto.regional !== undefined
              ? { regional: dto.regional || null }
              : {}),
            ...(dto.flag !== undefined ? { flag: dto.flag || null } : {}),
            ...(dto.isDefault !== undefined
              ? { isDefault: dto.isDefault }
              : {}),
            ...(dto.status !== undefined ? { status: dto.status } : {}),
            ...(dto.sortOrder !== undefined
              ? { sortOrder: dto.sortOrder }
              : {}),
            ...(dto.isRtl !== undefined ? { isRtl: dto.isRtl } : {}),
          },
        });
      });
      return this.findOne(language.id);
    } catch (error) {
      this.throwPersistenceError(error);
    }
  }

  async setDefault(id: number) {
    const language = await this.findOne(id);
    const result = await this.prisma.$transaction(async (transaction) => {
      await transaction.language.updateMany({
        where: { isDefault: true, id: { not: language.id } },
        data: { isDefault: false },
      });
      return transaction.language.update({
        where: { id: language.id },
        data: { isDefault: true, status: "published" },
      });
    });
    return this.findOne(result.id);
  }

  async reorder(dto: ReorderLanguagesDto) {
    const ids = dto.items.map(({ id }) => id);
    assertUniqueLanguageOrder(ids);
    const existingCount = await this.prisma.language.count({
      where: { id: { in: ids } },
    });
    if (existingCount !== ids.length) {
      throw new NotFoundException("Một hoặc nhiều ngôn ngữ không tồn tại.");
    }
    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.language.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );
    return this.findAllForAdmin();
  }

  async remove(id: number) {
    const language = await this.findOne(id);
    if (language.isDefault) {
      throw new ConflictException("Không thể xóa ngôn ngữ mặc định.");
    }
    await this.assertLocaleIsUnused(language.locale);
    await this.prisma.language.delete({ where: { id } });
    return { success: true, id };
  }

  async assertTranslationLocales(locales: string[]) {
    const languages = await this.prisma.language.findMany({
      select: { locale: true, isDefault: true },
    });
    assertRequiredTranslationLocales(locales, languages);
  }

  async getDefaultLocale() {
    const language = await this.prisma.language.findFirst({
      where: { isDefault: true, status: "published" },
      select: { locale: true },
    });
    return language?.locale ?? "vi";
  }

  private async findRecord(id: number) {
    const language = await this.prisma.language.findUnique({
      where: { id },
      select: LANGUAGE_RESPONSE_SELECT,
    });
    if (!language) throw new NotFoundException("Không tìm thấy ngôn ngữ.");
    return language;
  }

  private normalizeCreate(dto: CreateLanguageDto) {
    return {
      name: dto.name.trim(),
      nativeName: dto.nativeName?.trim() || null,
      locale: dto.locale,
      code: dto.code,
      regional: dto.regional || null,
      flag: dto.flag || null,
      isDefault: dto.isDefault,
      status: dto.status,
      sortOrder: dto.sortOrder,
      isRtl: dto.isRtl,
    };
  }

  private async assertLocaleIsUnused(locale: string) {
    const [
      levels,
      paymentMethods,
      menuTranslations,
      menuItemTranslations,
      announcementTranslations,
    ] =
      await this.prisma.$transaction([
        this.prisma.monetizationLevelTranslation.count({ where: { locale } }),
        this.prisma.paymentMethodTranslation.count({ where: { locale } }),
        this.prisma.websiteMenuTranslation.count({ where: { locale } }),
        this.prisma.websiteMenuItemTranslation.count({ where: { locale } }),
        this.prisma.announcementTranslation.count({ where: { locale } }),
      ]);
    if (
      levels +
        paymentMethods +
        menuTranslations +
        menuItemTranslations +
        announcementTranslations >
      0
    ) {
      throw new ConflictException(
        "Ngôn ngữ đã có nội dung dịch. Hãy tắt thay vì xóa hoặc đổi locale.",
      );
    }
  }

  private throwPersistenceError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictException("Locale hoặc code đã tồn tại.");
    }
    throw error;
  }
}
