import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";
import type { CreateLanguageDto } from "./dto/create-language.dto";
import type { ReorderLanguagesDto } from "./dto/reorder-languages.dto";
import type { UpdateLanguageDto } from "./dto/update-language.dto";
import type { UpdateUiTranslationsDto } from "./dto/update-ui-translations.dto";

const publicLanguageSelect = {
  id: true,
  name: true,
  nativeName: true,
  locale: true,
  code: true,
  regional: true,
  flag: true,
  isDefault: true,
  status: true,
  isRtl: true,
  sortOrder: true,
  uiMessagesJson: true,
  uiCatalogSize: true,
  uiTranslationVersion: true,
  uiUpdatedAt: true,
} satisfies Prisma.LanguageSelect;

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
      select: publicLanguageSelect,
    });
    return {
      items: items.map((language) => this.toLanguageResponse(language, true)),
      total: items.length,
      defaultLocale:
        items.find((language) => language.isDefault)?.locale ?? null,
    };
  }

  async findPublished() {
    const items = await this.prisma.language.findMany({
      where: { status: "published" },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: publicLanguageSelect,
    });
    const value = {
      items: items.map((language) => this.toLanguageResponse(language, false)),
      defaultLocale:
        items.find((language) => language.isDefault)?.locale ??
        items[0]?.locale ??
        null,
    };
    return value;
  }

  async findOne(id: number) {
    const language = await this.prisma.language.findUnique({
      where: { id },
      select: publicLanguageSelect,
    });
    if (!language) throw new NotFoundException("Không tìm thấy ngôn ngữ.");
    return this.toLanguageResponse(language, true);
  }

  async findUiTranslations(id: number) {
    const language = await this.prisma.language.findUnique({
      where: { id },
      select: publicLanguageSelect,
    });
    if (!language) throw new NotFoundException("Không tìm thấy ngôn ngữ.");
    const messages = this.parseUiMessages(language.uiMessagesJson);
    return {
      language: this.toLanguageResponse(language, true),
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
      select: publicLanguageSelect,
    });
    if (!language) throw new NotFoundException("Không tìm thấy ngôn ngữ.");
    return {
      locale: language.locale,
      isRtl: language.isRtl,
      messages: this.parseUiMessages(language.uiMessagesJson),
      version: language.uiTranslationVersion,
    };
  }

  async updateUiTranslations(id: number, dto: UpdateUiTranslationsDto) {
    const language = await this.prisma.language.findUnique({
      where: { id },
      select: { id: true, uiMessagesJson: true },
    });
    if (!language) throw new NotFoundException("Không tìm thấy ngôn ngữ.");

    const messages = this.parseUiMessages(language.uiMessagesJson);
    const removedKeys = new Set(dto.removedKeys ?? []);
    const seenKeys = new Set<string>();
    for (const entry of dto.entries) {
      if (!entry.value.trim()) continue;
      if (removedKeys.has(entry.key)) {
        throw new BadRequestException(
          `Translation key vừa cập nhật vừa xóa: ${entry.key}.`,
        );
      }
      if (seenKeys.has(entry.key)) {
        throw new BadRequestException(`Translation key bị trùng: ${entry.key}.`);
      }
      seenKeys.add(entry.key);
      messages[entry.key] = entry.value;
    }
    for (const key of removedKeys) delete messages[key];

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
    if (dto.isDefault && dto.status !== "published") {
      throw new BadRequestException(
        "Ngôn ngữ mặc định phải ở trạng thái xuất bản.",
      );
    }
    try {
      const language = await this.prisma.$transaction(async (transaction) => {
        if (dto.isDefault) {
          await transaction.language.updateMany({
            where: { isDefault: true },
            data: { isDefault: false },
          });
        }
        return transaction.language.create({
          data: this.normalizeCreate(dto),
        });
      });
      return this.findOne(language.id);
    } catch (error) {
      this.rethrowUnique(error);
      throw error;
    }
  }

  async update(id: number, dto: UpdateLanguageDto) {
    const existing = await this.findOne(id);
    if (existing.isDefault && dto.isDefault === false) {
      throw new BadRequestException(
        "Hãy đặt ngôn ngữ khác làm mặc định trước.",
      );
    }
    const nextIsDefault = dto.isDefault ?? existing.isDefault;
    const nextStatus = dto.status ?? existing.status;
    if (nextIsDefault && nextStatus !== "published") {
      throw new BadRequestException(
        "Ngôn ngữ mặc định phải ở trạng thái xuất bản.",
      );
    }
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
      this.rethrowUnique(error);
      throw error;
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
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException("Language id không được trùng nhau.");
    }
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
    const uniqueLocales = [...new Set(locales)];
    if (uniqueLocales.length !== locales.length) {
      throw new BadRequestException(
        "Mỗi ngôn ngữ chỉ được khai báo một lần.",
      );
    }
    const languages = await this.prisma.language.findMany({
      select: { locale: true, isDefault: true },
    });
    const known = new Set(languages.map(({ locale }) => locale));
    const unsupported = uniqueLocales.filter((locale) => !known.has(locale));
    if (unsupported.length) {
      throw new BadRequestException(
        `Locale không tồn tại: ${unsupported.join(", ")}.`,
      );
    }
    const defaultLocale = languages.find(({ isDefault }) => isDefault)?.locale;
    if (defaultLocale && !known.has(defaultLocale)) {
      throw new BadRequestException(
        "Cấu hình ngôn ngữ mặc định không hợp lệ.",
      );
    }
    if (defaultLocale && !uniqueLocales.includes(defaultLocale)) {
      throw new BadRequestException(
        `Thiếu bản dịch bắt buộc cho locale mặc định "${defaultLocale}".`,
      );
    }
  }

  async getDefaultLocale() {
    const language = await this.prisma.language.findFirst({
      where: { isDefault: true, status: "published" },
      select: { locale: true },
    });
    return language?.locale ?? "vi";
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
    const [levels, paymentMethods, menuTranslations, menuItemTranslations] =
      await this.prisma.$transaction([
      this.prisma.monetizationLevelTranslation.count({ where: { locale } }),
      this.prisma.paymentMethodTranslation.count({ where: { locale } }),
      this.prisma.websiteMenuTranslation.count({ where: { locale } }),
      this.prisma.websiteMenuItemTranslation.count({ where: { locale } }),
    ]);
    if (
      levels +
        paymentMethods +
        menuTranslations +
        menuItemTranslations >
      0
    ) {
      throw new ConflictException(
        "Ngôn ngữ đã có nội dung dịch. Hãy tắt thay vì xóa hoặc đổi locale.",
      );
    }
  }

  private rethrowUnique(error: unknown): never | void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictException("Locale hoặc code đã tồn tại.");
    }
  }

  private parseUiMessages(value: string) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
      return Object.fromEntries(
        Object.entries(parsed).filter(
          (entry): entry is [string, string] => typeof entry[1] === "string",
        ),
      );
    } catch {
      return {};
    }
  }

  private toLanguageResponse(
    language: Prisma.LanguageGetPayload<{ select: typeof publicLanguageSelect }>,
    includeStatus: boolean,
  ) {
    const messages = this.parseUiMessages(language.uiMessagesJson);
    return {
      id: language.id,
      name: language.name,
      nativeName: language.nativeName,
      locale: language.locale,
      code: language.code,
      regional: language.regional,
      flag: language.flag,
      isDefault: language.isDefault,
      ...(includeStatus ? { status: language.status } : {}),
      sortOrder: language.sortOrder,
      isRtl: language.isRtl,
      uiTranslation: {
        translatedKeys: Object.keys(messages).length,
        catalogSize: language.uiCatalogSize,
        version: language.uiTranslationVersion,
        updatedAt: language.uiUpdatedAt,
      },
    };
  }
}
