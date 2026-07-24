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

const publicLanguageSelect = {
  id: true,
  name: true,
  nativeName: true,
  locale: true,
  code: true,
  regional: true,
  flag: true,
  isDefault: true,
  isRtl: true,
  sortOrder: true,
} satisfies Prisma.LanguageSelect;

type PublishedLanguagesResult = {
  items: Array<
    Prisma.LanguageGetPayload<{ select: typeof publicLanguageSelect }>
  >;
  defaultLocale: string | null;
};

@Injectable()
export class LanguagesService implements OnModuleInit {
  private publishedCache:
    | { expiresAt: number; value: PublishedLanguagesResult }
    | undefined;

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
    });
    return {
      items,
      total: items.length,
      defaultLocale:
        items.find((language) => language.isDefault)?.locale ?? null,
    };
  }

  async findPublished() {
    if (this.publishedCache && this.publishedCache.expiresAt > Date.now()) {
      return this.publishedCache.value;
    }
    const items = await this.prisma.language.findMany({
      where: { status: "published" },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: publicLanguageSelect,
    });
    const value = {
      items,
      defaultLocale:
        items.find((language) => language.isDefault)?.locale ??
        items[0]?.locale ??
        null,
    };
    this.publishedCache = {
      expiresAt: Date.now() + 5 * 60_000,
      value,
    };
    return value;
  }

  async findOne(id: number) {
    const language = await this.prisma.language.findUnique({ where: { id } });
    if (!language) throw new NotFoundException("Không tìm thấy ngôn ngữ.");
    return language;
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
      this.invalidatePublishedCache();
      return language;
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
      this.invalidatePublishedCache();
      return language;
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
    this.invalidatePublishedCache();
    return result;
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
    this.invalidatePublishedCache();
    return this.findAllForAdmin();
  }

  async remove(id: number) {
    const language = await this.findOne(id);
    if (language.isDefault) {
      throw new ConflictException("Không thể xóa ngôn ngữ mặc định.");
    }
    await this.assertLocaleIsUnused(language.locale);
    await this.prisma.language.delete({ where: { id } });
    this.invalidatePublishedCache();
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

  private invalidatePublishedCache() {
    this.publishedCache = undefined;
  }
}
