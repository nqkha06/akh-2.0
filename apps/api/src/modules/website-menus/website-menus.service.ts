import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";
import { LanguagesService } from "../languages/languages.service";
import type {
  AssignWebsiteMenuLocationDto,
  CreateWebsiteMenuDto,
  PublicWebsiteMenusQueryDto,
  ReplaceWebsiteMenuTreeDto,
  UpdateWebsiteMenuDto,
  WebsiteMenuItemTranslationDto,
  WebsiteMenuTranslationDto,
  WebsiteMenuTreeItemDto,
} from "./dto/website-menu.dto";
import {
  WEBSITE_MENU_MAX_DEPTH,
  WEBSITE_MENU_MAX_ITEMS,
  websiteMenuLocations,
  type WebsiteMenuLocation,
} from "./website-menus.constants";

const menuInclude = {
  translations: { orderBy: { locale: "asc" as const } },
  items: {
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" as const }, { id: "asc" as const }],
    include: {
      translations: { orderBy: { locale: "asc" as const } },
      page: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          deletedAt: true,
        },
      },
    },
  },
  locations: { orderBy: { location: "asc" as const } },
} satisfies Prisma.WebsiteMenuInclude;

type MenuRecord = Prisma.WebsiteMenuGetPayload<{ include: typeof menuInclude }>;
type MenuItemRecord = MenuRecord["items"][number];
type AdminMenuItem = MenuItemRecord & { children: AdminMenuItem[] };

type SnapshotTranslation = {
  label: string;
  title: string | null;
  ariaLabel: string | null;
  urlOverride: string | null;
};

type SnapshotItem = {
  id: number;
  type: string;
  pageId: number | null;
  url: string | null;
  pageUrl: string | null;
  target: string;
  rel: string | null;
  iconKey: string | null;
  translations: Record<string, SnapshotTranslation>;
  children: SnapshotItem[];
};

type PublishedSnapshot = {
  schemaVersion: 1;
  menuId: number;
  key: string;
  version: number;
  defaultLocale: string;
  translations: Record<string, { title: string | null }>;
  items: SnapshotItem[];
};

type PublicMenuItem = {
  id: number;
  type: string;
  label: string;
  title: string | null;
  ariaLabel: string | null;
  href: string | null;
  target: "_self" | "_blank";
  rel: string | null;
  iconKey: string | null;
  children: PublicMenuItem[];
};

@Injectable()
export class WebsiteMenusService {
  private publicCache = new Map<
    string,
    { expiresAt: number; value: unknown }
  >();

  constructor(
    private readonly prisma: PrismaService,
    private readonly languagesService: LanguagesService,
  ) {}

  async findAllForAdmin() {
    const items = await this.prisma.websiteMenu.findMany({
      where: { deletedAt: null },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      include: {
        translations: { orderBy: { locale: "asc" } },
        locations: { orderBy: { location: "asc" } },
        _count: { select: { items: { where: { deletedAt: null } } } },
      },
    });
    return {
      items: items.map(({ _count, ...menu }) => ({
        ...menu,
        itemCount: _count.items,
        isDirty: menu.publishedVersion !== menu.draftVersion,
      })),
      total: items.length,
      allowedLocations: websiteMenuLocations,
    };
  }

  async findOneForAdmin(id: number) {
    return this.toAdminResponse(await this.findRecord(id));
  }

  async create(dto: CreateWebsiteMenuDto, userId: number) {
    const translations = this.normalizeMenuTranslations(dto.translations);
    await this.languagesService.assertTranslationLocales(
      translations.map(({ locale }) => locale),
    );
    try {
      const menu = await this.prisma.websiteMenu.create({
        data: {
          key: dto.key.trim().toLowerCase(),
          name: dto.name.trim(),
          description: this.emptyToNull(dto.description),
          createdById: userId,
          updatedById: userId,
          translations: { create: translations },
        },
        include: menuInclude,
      });
      return this.toAdminResponse(menu);
    } catch (error) {
      this.rethrowUnique(error);
      throw error;
    }
  }

  async update(id: number, dto: UpdateWebsiteMenuDto, userId: number) {
    await this.findRecord(id);
    const translations = dto.translations
      ? this.normalizeMenuTranslations(dto.translations)
      : undefined;
    if (translations) {
      await this.languagesService.assertTranslationLocales(
        translations.map(({ locale }) => locale),
      );
    }
    const menu = await this.prisma.websiteMenu.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: this.emptyToNull(dto.description) }
          : {}),
        updatedById: userId,
        draftVersion: { increment: 1 },
        ...(translations
          ? {
              translations: {
                deleteMany: {},
                create: translations,
              },
            }
          : {}),
      },
      include: menuInclude,
    });
    this.clearPublicCache();
    return this.toAdminResponse(menu);
  }

  async replaceTree(
    id: number,
    dto: ReplaceWebsiteMenuTreeDto,
    userId: number,
  ) {
    const menu = await this.findRecord(id);
    if (menu.draftVersion !== dto.expectedVersion) {
      throw new ConflictException({
        code: "MENU_VERSION_CONFLICT",
        message:
          "Menu đã được cập nhật ở phiên khác. Hãy tải lại trước khi lưu.",
        currentVersion: menu.draftVersion,
      });
    }
    this.assertTreeShape(dto.items);
    const translations = dto.items.flatMap((item) =>
      this.flattenDtos(item).flatMap((entry) => entry.translations),
    );
    await this.assertItemTranslationLocales(translations);
    const defaultLocale = await this.languagesService.getDefaultLocale();
    const missingDefaultLabel = dto.items
      .flatMap((item) => this.flattenDtos(item))
      .find(
        (item) =>
          !item.translations.some(
            (translation) =>
              translation.locale === defaultLocale &&
              translation.label.trim().length > 0,
          ),
      );
    if (missingDefaultLabel) {
      throw new BadRequestException(
        `Mỗi mục menu phải có nhãn locale mặc định "${defaultLocale}".`,
      );
    }
    await this.assertPagesExist(dto.items, false);
    dto.items.forEach((item) => this.validateItem(item));

    await this.prisma.$transaction(async (transaction) => {
      await transaction.websiteMenuItem.deleteMany({ where: { menuId: id } });
      for (const [sortOrder, item] of dto.items.entries()) {
        await this.createTreeItem(transaction, id, null, item, sortOrder);
      }
      const updated = await transaction.websiteMenu.updateMany({
        where: { id, draftVersion: dto.expectedVersion, deletedAt: null },
        data: {
          draftVersion: { increment: 1 },
          updatedById: userId,
        },
      });
      if (updated.count !== 1) {
        throw new ConflictException({
          code: "MENU_VERSION_CONFLICT",
          message:
            "Menu đã được cập nhật ở phiên khác. Hãy tải lại trước khi lưu.",
        });
      }
    });
    this.clearPublicCache();
    return this.findOneForAdmin(id);
  }

  async publish(id: number, userId: number) {
    const menu = await this.findRecord(id);
    const defaultLocale = await this.languagesService.getDefaultLocale();
    await this.assertPagesExist(
      this.toDtoTree(menu.items, null),
      true,
    );
    this.assertPublishable(menu, defaultLocale);
    const snapshot = this.buildSnapshot(menu, defaultLocale);
    await this.prisma.websiteMenu.update({
      where: { id },
      data: {
        status: "published",
        publishedVersion: menu.draftVersion,
        publishedSnapshotJson: JSON.stringify(snapshot),
        publishedAt: new Date(),
        updatedById: userId,
      },
    });
    this.clearPublicCache();
    return this.findOneForAdmin(id);
  }

  async unpublish(id: number, userId: number) {
    await this.findRecord(id);
    await this.prisma.websiteMenu.update({
      where: { id },
      data: {
        status: "draft",
        publishedSnapshotJson: null,
        publishedAt: null,
        updatedById: userId,
      },
    });
    this.clearPublicCache();
    return this.findOneForAdmin(id);
  }

  async duplicate(id: number, userId: number) {
    const source = await this.findRecord(id);
    const key = await this.availableCopyKey(source.key);
    const created = await this.prisma.websiteMenu.create({
      data: {
        key,
        name: `${source.name} (bản sao)`,
        description: source.description,
        createdById: userId,
        updatedById: userId,
        translations: {
          create: source.translations.map(({ locale, title }) => ({
            locale,
            title,
          })),
        },
      },
    });
    const dtoItems = this.toDtoTree(source.items, null);
    for (const [sortOrder, item] of dtoItems.entries()) {
      await this.createTreeItem(this.prisma, created.id, null, item, sortOrder);
    }
    return this.findOneForAdmin(created.id);
  }

  async remove(id: number) {
    const menu = await this.findRecord(id);
    if (menu.locations.length) {
      throw new ConflictException({
        code: "MENU_IN_USE",
        message: "Không thể xóa menu đang được gán vào vị trí hiển thị.",
        locations: menu.locations.map(({ location }) => location),
      });
    }
    await this.prisma.websiteMenu.update({
      where: { id },
      data: { deletedAt: new Date(), status: "draft" },
    });
    this.clearPublicCache();
    return { success: true, id };
  }

  async findLocations() {
    const assignments = await this.prisma.websiteMenuLocation.findMany({
      include: {
        menu: {
          select: {
            id: true,
            key: true,
            name: true,
            status: true,
            publishedVersion: true,
          },
        },
      },
      orderBy: { location: "asc" },
    });
    return {
      items: websiteMenuLocations.map((location) => ({
        location,
        assignment:
          assignments.find((item) => item.location === location) ?? null,
      })),
    };
  }

  async assignLocation(dto: AssignWebsiteMenuLocationDto, userId: number) {
    const menu = await this.findRecord(dto.menuId);
    if (!websiteMenuLocations.includes(dto.location)) {
      throw new BadRequestException("Vị trí menu không hợp lệ.");
    }
    await this.prisma.websiteMenuLocation.upsert({
      where: { location: dto.location },
      update: { menuId: menu.id, updatedById: userId },
      create: {
        location: dto.location,
        menuId: menu.id,
        updatedById: userId,
      },
    });
    this.clearPublicCache();
    return this.findLocations();
  }

  async unassignLocation(location: string) {
    if (
      !websiteMenuLocations.includes(location as WebsiteMenuLocation)
    ) {
      throw new BadRequestException("Vị trí menu không hợp lệ.");
    }
    await this.prisma.websiteMenuLocation.deleteMany({ where: { location } });
    this.clearPublicCache();
    return this.findLocations();
  }

  async findPublishedByLocations(query: PublicWebsiteMenusQueryDto) {
    const requestedLocations = this.parseLocations(query.locations);
    const locale = query.locale?.trim() || (await this.languagesService.getDefaultLocale());
    const cacheKey = `${locale}:${requestedLocations.join(",")}`;
    const cached = this.publicCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const assignments = await this.prisma.websiteMenuLocation.findMany({
      where: {
        location: { in: requestedLocations },
        menu: {
          deletedAt: null,
          status: "published",
          publishedSnapshotJson: { not: null },
        },
      },
      include: { menu: true },
    });
    const menus: Record<string, unknown> = {};
    for (const assignment of assignments) {
      const snapshot = this.parseSnapshot(
        assignment.menu.publishedSnapshotJson,
      );
      if (!snapshot) continue;
      menus[assignment.location] = this.localizeSnapshot(snapshot, locale);
    }
    const value = { locale, menus };
    this.publicCache.set(cacheKey, {
      expiresAt: Date.now() + 60_000,
      value,
    });
    return value;
  }

  async assertPagesNotInUse(ids: number[]) {
    const references = await this.prisma.websiteMenuItem.findMany({
      where: {
        pageId: { in: ids },
        deletedAt: null,
        menu: { deletedAt: null },
      },
      select: { pageId: true, menu: { select: { id: true, name: true } } },
    });
    if (references.length) {
      throw new ConflictException({
        code: "PAGE_IN_USE",
        message: "Không thể xóa trang đang được dùng trong menu website.",
        references,
      });
    }
  }

  private async findRecord(id: number) {
    const menu = await this.prisma.websiteMenu.findFirst({
      where: { id, deletedAt: null },
      include: menuInclude,
    });
    if (!menu) throw new NotFoundException("Không tìm thấy menu website.");
    return menu;
  }

  private toAdminResponse(menu: MenuRecord) {
    return {
      ...menu,
      items: this.buildAdminTree(menu.items, null),
      isDirty: menu.publishedVersion !== menu.draftVersion,
    };
  }

  private buildAdminTree(
    items: MenuItemRecord[],
    parentId: number | null,
  ): AdminMenuItem[] {
    return items
      .filter((item) => item.parentId === parentId)
      .map((item) => ({
        ...item,
        children: this.buildAdminTree(items, item.id),
      }));
  }

  private toDtoTree(
    items: MenuItemRecord[],
    parentId: number | null,
  ): WebsiteMenuTreeItemDto[] {
    return items
      .filter((item) => item.parentId === parentId)
      .map((item) => ({
        id: item.id,
        type: item.type as WebsiteMenuTreeItemDto["type"],
        ...(item.pageId ? { pageId: item.pageId } : {}),
        ...(item.url ? { url: item.url } : {}),
        target: item.target as WebsiteMenuTreeItemDto["target"],
        ...(item.rel ? { rel: item.rel } : {}),
        ...(item.iconKey ? { iconKey: item.iconKey } : {}),
        isEnabled: item.isEnabled,
        translations: item.translations.map(
          ({ locale, label, title, ariaLabel, urlOverride }) => ({
            locale,
            label,
            ...(title ? { title } : {}),
            ...(ariaLabel ? { ariaLabel } : {}),
            ...(urlOverride ? { urlOverride } : {}),
          }),
        ),
        children: this.toDtoTree(items, item.id),
      }));
  }

  private async createTreeItem(
    transaction: Prisma.TransactionClient | PrismaService,
    menuId: number,
    parentId: number | null,
    item: WebsiteMenuTreeItemDto,
    sortOrder: number,
  ): Promise<void> {
    const created = await transaction.websiteMenuItem.create({
      data: {
        menuId,
        parentId,
        type: item.type,
        pageId: item.type === "PAGE" ? item.pageId : null,
        url:
          item.type === "CUSTOM_URL" || item.type === "ANCHOR"
            ? item.url?.trim() || null
            : null,
        target: item.target,
        rel: this.normalizeRel(item.target, item.rel),
        iconKey: item.iconKey || null,
        isEnabled: item.isEnabled,
        sortOrder,
        translations: {
          create: this.normalizeItemTranslations(item.translations),
        },
      },
    });
    for (const [childOrder, child] of item.children.entries()) {
      await this.createTreeItem(
        transaction,
        menuId,
        created.id,
        child,
        childOrder,
      );
    }
  }

  private assertTreeShape(items: WebsiteMenuTreeItemDto[]) {
    let count = 0;
    const walk = (nodes: WebsiteMenuTreeItemDto[], depth: number) => {
      if (depth > WEBSITE_MENU_MAX_DEPTH) {
        throw new BadRequestException({
          code: "MENU_MAX_DEPTH",
          message: `Menu chỉ hỗ trợ tối đa ${WEBSITE_MENU_MAX_DEPTH} cấp.`,
        });
      }
      for (const item of nodes) {
        count += 1;
        walk(item.children, depth + 1);
      }
    };
    walk(items, 1);
    if (count > WEBSITE_MENU_MAX_ITEMS) {
      throw new BadRequestException(
        `Menu chỉ hỗ trợ tối đa ${WEBSITE_MENU_MAX_ITEMS} mục.`,
      );
    }
  }

  private validateItem(item: WebsiteMenuTreeItemDto) {
    if (item.type === "PAGE" && !item.pageId) {
      throw new BadRequestException("Mục kiểu PAGE phải chọn một trang.");
    }
    if (item.type === "GROUP" && (item.url || item.pageId)) {
      throw new BadRequestException("Nhóm menu không được có URL hoặc page.");
    }
    if (item.type === "ANCHOR") {
      if (!item.url || !/^#[A-Za-z][\w:-]*$/.test(item.url)) {
        throw new BadRequestException(
          "Anchor phải bắt đầu bằng # và có định dạng hợp lệ.",
        );
      }
    }
    if (item.type === "CUSTOM_URL") this.assertSafeUrl(item.url);
    for (const translation of item.translations) {
      if (!translation.label.trim()) {
        throw new BadRequestException("Nhãn menu không được để trống.");
      }
      if (translation.urlOverride) {
        if (item.type === "GROUP") {
          throw new BadRequestException(
            "Nhóm menu không được có URL riêng theo locale.",
          );
        }
        this.assertSafeUrl(translation.urlOverride);
      }
    }
    item.children.forEach((child) => this.validateItem(child));
  }

  private assertSafeUrl(value?: string) {
    const url = value?.trim();
    if (!url) throw new BadRequestException("URL menu không được để trống.");
    if (
      (url.startsWith("/") && !url.startsWith("//") && !url.includes("\\")) ||
      url.startsWith("#")
    ) {
      return;
    }
    try {
      const parsed = new URL(url);
      if (!["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol)) {
        throw new Error("unsupported protocol");
      }
    } catch {
      throw new BadRequestException({
        code: "INVALID_MENU_URL",
        message: "URL menu không hợp lệ hoặc dùng giao thức không an toàn.",
      });
    }
  }

  private async assertPagesExist(
    items: WebsiteMenuTreeItemDto[],
    requirePublished: boolean,
  ) {
    const ids = [
      ...new Set(
        items.flatMap((item) =>
          this.flattenDtos(item)
            .filter((entry) => entry.type === "PAGE")
            .map((entry) => entry.pageId)
            .filter((id): id is number => typeof id === "number"),
        ),
      ),
    ];
    if (!ids.length) return;
    const count = await this.prisma.page.count({
      where: {
        id: { in: ids },
        deletedAt: null,
        ...(requirePublished ? { status: "PUBLISHED" } : {}),
      },
    });
    if (count !== ids.length) {
      throw new BadRequestException({
        code: requirePublished ? "MENU_PAGE_NOT_PUBLISHED" : "MENU_PAGE_NOT_FOUND",
        message: requirePublished
          ? "Một hoặc nhiều trang trong menu chưa được xuất bản."
          : "Một hoặc nhiều trang trong menu không tồn tại.",
      });
    }
  }

  private async assertItemTranslationLocales(
    translations: WebsiteMenuItemTranslationDto[],
  ) {
    const locales = [...new Set(translations.map(({ locale }) => locale))];
    const languages = await this.prisma.language.findMany({
      select: { locale: true },
    });
    const known = new Set(languages.map(({ locale }) => locale));
    const unsupported = locales.filter((locale) => !known.has(locale));
    if (unsupported.length) {
      throw new BadRequestException(
        `Locale không tồn tại: ${unsupported.join(", ")}.`,
      );
    }
    // Draft items may omit non-default locales. Completeness of the default
    // locale is checked per item before the tree is persisted.
    for (const locale of locales) {
      if (!known.has(locale)) {
        throw new BadRequestException(`Locale không tồn tại: ${locale}.`);
      }
    }
  }

  private assertPublishable(menu: MenuRecord, defaultLocale: string) {
    if (
      !menu.translations.some(
        ({ locale }) => locale === defaultLocale,
      )
    ) {
      throw new BadRequestException(
        `Menu thiếu bản dịch locale mặc định "${defaultLocale}".`,
      );
    }
    for (const item of menu.items) {
      const translation = item.translations.find(
        ({ locale }) => locale === defaultLocale,
      );
      if (!translation?.label.trim()) {
        throw new BadRequestException({
          code: "MENU_TRANSLATION_INCOMPLETE",
          message: `Mục menu #${item.id} thiếu nhãn locale "${defaultLocale}".`,
        });
      }
    }
  }

  private buildSnapshot(
    menu: MenuRecord,
    defaultLocale: string,
  ): PublishedSnapshot {
    const buildItems = (parentId: number | null): SnapshotItem[] =>
      menu.items
        .filter((item) => item.parentId === parentId && item.isEnabled)
        .map((item) => ({
          id: item.id,
          type: item.type,
          pageId: item.pageId,
          url: item.url,
          pageUrl: item.page ? `/${item.page.slug}` : null,
          target: item.target,
          rel: this.normalizeRel(item.target, item.rel),
          iconKey: item.iconKey,
          translations: Object.fromEntries(
            item.translations.map((translation) => [
              translation.locale,
              {
                label: translation.label,
                title: translation.title,
                ariaLabel: translation.ariaLabel,
                urlOverride: translation.urlOverride,
              },
            ]),
          ),
          children: buildItems(item.id),
        }));
    return {
      schemaVersion: 1,
      menuId: menu.id,
      key: menu.key,
      version: menu.draftVersion,
      defaultLocale,
      translations: Object.fromEntries(
        menu.translations.map(({ locale, title }) => [locale, { title }]),
      ),
      items: buildItems(null),
    };
  }

  private localizeSnapshot(snapshot: PublishedSnapshot, locale: string) {
    const localeCandidates = this.localeCandidates(locale, snapshot.defaultLocale);
    const pick = <T>(translations: Record<string, T>) => {
      for (const candidate of localeCandidates) {
        if (translations[candidate]) return translations[candidate];
      }
      return Object.values(translations)[0];
    };
    const localizeItems = (items: SnapshotItem[]): PublicMenuItem[] =>
      items.map((item) => {
        const translation = pick(item.translations);
        const href =
          translation?.urlOverride || item.pageUrl || item.url || null;
        return {
          id: item.id,
          type: item.type,
          label: translation?.label ?? "",
          title: translation?.title ?? null,
          ariaLabel: translation?.ariaLabel ?? null,
          href,
          target: item.target === "BLANK" ? "_blank" : "_self",
          rel: this.normalizeRel(item.target, item.rel),
          iconKey: item.iconKey,
          children: localizeItems(item.children),
        };
      });
    return {
      id: snapshot.menuId,
      key: snapshot.key,
      version: snapshot.version,
      title: pick(snapshot.translations)?.title ?? null,
      items: localizeItems(snapshot.items),
    };
  }

  private parseLocations(value?: string): WebsiteMenuLocation[] {
    if (!value?.trim()) return [...websiteMenuLocations];
    const requested = [...new Set(value.split(",").map((item) => item.trim()))];
    const invalid = requested.filter(
      (location) =>
        !websiteMenuLocations.includes(location as WebsiteMenuLocation),
    );
    if (invalid.length) {
      throw new BadRequestException(
        `Vị trí menu không hợp lệ: ${invalid.join(", ")}.`,
      );
    }
    return requested as WebsiteMenuLocation[];
  }

  private parseSnapshot(value: string | null): PublishedSnapshot | null {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value) as PublishedSnapshot;
      return parsed.schemaVersion === 1 ? parsed : null;
    } catch {
      return null;
    }
  }

  private localeCandidates(locale: string, defaultLocale: string) {
    const base = locale.split("-")[0];
    return [...new Set([locale, base, defaultLocale])];
  }

  private normalizeMenuTranslations(
    translations: WebsiteMenuTranslationDto[],
  ) {
    return translations.map(({ locale, title }) => ({
      locale,
      title: this.emptyToNull(title),
    }));
  }

  private normalizeItemTranslations(
    translations: WebsiteMenuItemTranslationDto[],
  ) {
    return translations.map(
      ({ locale, label, title, ariaLabel, urlOverride }) => ({
        locale,
        label: label.trim(),
        title: this.emptyToNull(title),
        ariaLabel: this.emptyToNull(ariaLabel),
        urlOverride: this.emptyToNull(urlOverride),
      }),
    );
  }

  private normalizeRel(target: string, rel?: string | null) {
    const allowed = new Set([
      "nofollow",
      "sponsored",
      "ugc",
      "noopener",
      "noreferrer",
    ]);
    const values = (rel ?? "")
      .split(/\s+/)
      .filter((value) => allowed.has(value));
    if (target === "BLANK") {
      values.push("noopener", "noreferrer");
    }
    return [...new Set(values)].join(" ") || null;
  }

  private flattenDtos(item: WebsiteMenuTreeItemDto): WebsiteMenuTreeItemDto[] {
    return [item, ...item.children.flatMap((child) => this.flattenDtos(child))];
  }

  private async availableCopyKey(base: string) {
    for (let index = 1; index <= 100; index += 1) {
      const suffix = index === 1 ? "copy" : `copy-${index}`;
      const candidate = `${base.slice(0, 42)}-${suffix}`;
      const exists = await this.prisma.websiteMenu.findUnique({
        where: { key: candidate },
        select: { id: true },
      });
      if (!exists) return candidate;
    }
    throw new ConflictException("Không thể tạo key cho bản sao menu.");
  }

  private emptyToNull(value?: string) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private rethrowUnique(error: unknown): never | void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictException({
        code: "MENU_KEY_EXISTS",
        message: "Key menu đã tồn tại.",
      });
    }
  }

  private clearPublicCache() {
    this.publicCache.clear();
  }
}
