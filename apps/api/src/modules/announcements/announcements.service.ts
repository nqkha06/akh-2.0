import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, type Announcement } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";
import { LanguagesService } from "../languages/languages.service";
import type {
  AnnouncementTranslationDto,
  AnnouncementTargetRulesDto,
  CreateAnnouncementDto,
  ListAnnouncementsQueryDto,
  ListMemberAnnouncementsQueryDto,
  UpdateAnnouncementDto,
} from "./dto/announcement.dto";
import type { AnnouncementStatus } from "./announcement.constants";

type TargetRules = Pick<AnnouncementTargetRulesDto, "userIds" | "roles">;

const adminInclude = {
  createdBy: { select: { id: true, name: true, email: true } },
  updatedBy: { select: { id: true, name: true, email: true } },
  translations: { orderBy: { locale: "asc" as const } },
  users: {
    select: {
      seenAt: true,
      readAt: true,
      dismissedAt: true,
      acknowledgedAt: true,
      ctaClickedAt: true,
    },
  },
} satisfies Prisma.AnnouncementInclude;

type AdminAnnouncement = Prisma.AnnouncementGetPayload<{ include: typeof adminInclude }>;
type MemberAnnouncement = Prisma.AnnouncementGetPayload<{
  include: { users: true; translations: true };
}>;

type Translation = {
  locale: string;
  title: string;
  summary?: string | null;
  content: string;
  actionLabel?: string | null;
};

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly languagesService: LanguagesService,
  ) {}

  async listForAdmin(query: ListAnnouncementsQueryDto) {
    const now = new Date();
    const where: Prisma.AnnouncementWhereInput = {
      deletedAt: null,
      ...(query.displayType ? { displayType: query.displayType } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.targetType ? { targetType: query.targetType } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            createdAt: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
            },
          }
        : {}),
      AND: [
        this.adminStatusWhere(query.status, now),
        ...(query.search?.trim()
          ? [{
              OR: [
                { slug: { contains: query.search.trim() } },
                {
                  translations: {
                    some: {
                      OR: [
                        { title: { contains: query.search.trim() } },
                        { summary: { contains: query.search.trim() } },
                      ],
                    },
                  },
                },
              ],
            }]
          : []),
      ],
    };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.announcement.findMany({
        where,
        include: adminInclude,
        orderBy: [{ createdAt: "desc" }],
        skip: (query.page - 1) * query.perPage,
        take: query.perPage,
      }),
      this.prisma.announcement.count({ where }),
    ]);
    return {
      items: await Promise.all(records.map((record) => this.toAdminResponse(record))),
      pagination: {
        page: query.page,
        perPage: query.perPage,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.perPage)),
      },
    };
  }

  async findForAdmin(id: number) {
    return this.toAdminResponse(await this.findRecord(id));
  }

  async create(adminId: number, dto: CreateAnnouncementDto) {
    const defaultLocale = await this.validatePayload(dto);
    const defaultTranslation = this.defaultTranslation(dto.translations, defaultLocale);
    const slug = await this.uniqueSlug(dto.slug || defaultTranslation.title);
    const record = await this.prisma.announcement.create({
      data: {
        ...this.dataFromDto(dto, defaultTranslation),
        slug,
        status: "draft",
        createdById: adminId,
        updatedById: adminId,
      },
      include: adminInclude,
    });
    return this.toAdminResponse(record);
  }

  async update(adminId: number, id: number, dto: UpdateAnnouncementDto) {
    const existing = await this.findRecord(id);
    const merged = this.mergeForValidation(existing, dto);
    const defaultLocale = await this.validatePayload(merged);
    const defaultTranslation = this.defaultTranslation(merged.translations, defaultLocale);
    const slug = dto.slug && dto.slug !== existing.slug
      ? await this.uniqueSlug(dto.slug, id)
      : existing.slug;
    const record = await this.prisma.announcement.update({
      where: { id },
      data: {
        ...this.dataFromDto(merged, defaultTranslation, true),
        slug,
        status: existing.status,
        updatedById: adminId,
      },
      include: adminInclude,
    });
    return this.toAdminResponse(record);
  }

  async publish(adminId: number, id: number) {
    const existing = await this.findRecord(id);
    const now = new Date();
    if (existing.endsAt && existing.endsAt <= now) {
      throw new BadRequestException("Không thể xuất bản thông báo đã hết hạn.");
    }
    const status = existing.startsAt && existing.startsAt > now ? "scheduled" : "active";
    return this.toAdminResponse(await this.prisma.announcement.update({
      where: { id },
      data: {
        status,
        publishedAt: existing.publishedAt || now,
        updatedById: adminId,
      },
      include: adminInclude,
    }));
  }

  async pause(adminId: number, id: number) {
    await this.findRecord(id);
    return this.toAdminResponse(await this.prisma.announcement.update({
      where: { id },
      data: { status: "paused", updatedById: adminId },
      include: adminInclude,
    }));
  }

  async duplicate(adminId: number, id: number) {
    const existing = await this.findRecord(id);
    const record = await this.prisma.announcement.create({
      data: {
        title: `${existing.title} (Bản sao)`,
        slug: await this.uniqueSlug(`${existing.slug}-copy`),
        summary: existing.summary,
        content: existing.content,
        type: existing.type,
        priority: existing.priority,
        displayType: existing.displayType,
        status: "draft",
        targetType: existing.targetType,
        targetRulesJson: existing.targetRulesJson,
        actionLabel: existing.actionLabel,
        actionUrl: existing.actionUrl,
        isDismissible: existing.isDismissible,
        requiresAcknowledgement: existing.requiresAcknowledgement,
        startsAt: null,
        endsAt: null,
        createdById: adminId,
        updatedById: adminId,
        translations: {
          create: existing.translations.map((translation) => ({
            locale: translation.locale,
            title: `${translation.title} (Bản sao)`,
            summary: translation.summary,
            content: translation.content,
            actionLabel: translation.actionLabel,
          })),
        },
      },
      include: adminInclude,
    });
    return this.toAdminResponse(record);
  }

  async remove(id: number) {
    await this.findRecord(id);
    await this.prisma.announcement.update({
      where: { id },
      data: { deletedAt: new Date(), status: "paused" },
    });
    return { id, deleted: true as const };
  }

  async analytics(id: number) {
    return (await this.findForAdmin(id)).analytics;
  }

  async listForMember(userId: number, query: ListMemberAnnouncementsQueryDto, locale?: string) {
    const defaultLocale = await this.languagesService.getDefaultLocale();
    const records = await this.eligibleForUser(userId, query.displayType);
    const items = records
      .filter((record) => !record.users[0]?.dismissedAt)
      .filter((record) => !query.unreadOnly || !record.users[0]?.readAt);
    const start = (query.page - 1) * query.perPage;
    return {
      items: items.slice(start, start + query.perPage).map((record) => this.toMemberResponse(record, locale, defaultLocale)),
      pagination: {
        page: query.page,
        perPage: query.perPage,
        total: items.length,
        totalPages: Math.max(1, Math.ceil(items.length / query.perPage)),
      },
    };
  }

  async unreadCount(userId: number) {
    const records = await this.eligibleForUser(userId, "notification");
    return {
      count: records.filter((record) => !record.users[0]?.readAt && !record.users[0]?.dismissedAt).length,
    };
  }

  async activeBanners(userId: number, locale?: string) {
    const defaultLocale = await this.languagesService.getDefaultLocale();
    const records = await this.eligibleForUser(userId, "banner");
    return records
      .filter((record) => !record.users[0]?.dismissedAt)
      .map((record) => this.toMemberResponse(record, locale, defaultLocale));
  }

  async activeModals(userId: number, locale?: string) {
    const defaultLocale = await this.languagesService.getDefaultLocale();
    const records = await this.eligibleForUser(userId, "modal");
    return records
      .filter((record) => !record.users[0]?.dismissedAt)
      .filter((record) => !record.requiresAcknowledgement || !record.users[0]?.acknowledgedAt)
      .map((record) => this.toMemberResponse(record, locale, defaultLocale));
  }

  async findForMember(userId: number, id: number, locale?: string) {
    const record = (await this.eligibleForUser(userId)).find((item) => item.id === id);
    if (!record) throw new NotFoundException("Không tìm thấy thông báo.");
    return this.toMemberResponse(record, locale, await this.languagesService.getDefaultLocale());
  }

  async markSeen(userId: number, id: number) {
    await this.assertEligible(userId, id);
    const now = new Date();
    await this.prisma.announcementUser.upsert({
      where: { announcementId_userId: { announcementId: id, userId } },
      update: { seenAt: now },
      create: { announcementId: id, userId, seenAt: now },
    });
    return { success: true };
  }

  async markRead(userId: number, id: number) {
    await this.assertEligible(userId, id);
    const now = new Date();
    await this.prisma.announcementUser.upsert({
      where: { announcementId_userId: { announcementId: id, userId } },
      update: { seenAt: now, readAt: now },
      create: { announcementId: id, userId, seenAt: now, readAt: now },
    });
    return { success: true };
  }

  async dismiss(userId: number, id: number) {
    const announcement = await this.assertEligible(userId, id);
    if (!announcement.isDismissible) {
      throw new BadRequestException("Thông báo này không cho phép đóng.");
    }
    const now = new Date();
    await this.prisma.announcementUser.upsert({
      where: { announcementId_userId: { announcementId: id, userId } },
      update: { seenAt: now, dismissedAt: now },
      create: { announcementId: id, userId, seenAt: now, dismissedAt: now },
    });
    return { success: true };
  }

  async acknowledge(userId: number, id: number) {
    const announcement = await this.assertEligible(userId, id);
    if (!announcement.requiresAcknowledgement) {
      throw new BadRequestException("Thông báo này không yêu cầu xác nhận.");
    }
    const now = new Date();
    await this.prisma.announcementUser.upsert({
      where: { announcementId_userId: { announcementId: id, userId } },
      update: { seenAt: now, readAt: now, acknowledgedAt: now },
      create: { announcementId: id, userId, seenAt: now, readAt: now, acknowledgedAt: now },
    });
    return { success: true };
  }

  async trackClick(userId: number, id: number) {
    await this.assertEligible(userId, id);
    const now = new Date();
    await this.prisma.announcementUser.upsert({
      where: { announcementId_userId: { announcementId: id, userId } },
      update: { seenAt: now, readAt: now, ctaClickedAt: now },
      create: { announcementId: id, userId, seenAt: now, readAt: now, ctaClickedAt: now },
    });
    return { success: true };
  }

  async readAll(userId: number) {
    const records = await this.eligibleForUser(userId, "notification");
    const now = new Date();
    await this.prisma.$transaction(records.map((record) =>
      this.prisma.announcementUser.upsert({
        where: { announcementId_userId: { announcementId: record.id, userId } },
        update: { seenAt: now, readAt: now },
        create: { announcementId: record.id, userId, seenAt: now, readAt: now },
      }),
    ));
    return { updated: records.length };
  }

  private async eligibleForUser(userId: number, displayType?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });
    if (!user) throw new NotFoundException("Không tìm thấy người dùng.");
    const now = new Date();
    const records = await this.prisma.announcement.findMany({
      where: {
        deletedAt: null,
        status: { in: ["active", "scheduled"] },
        ...(displayType ? { displayType } : {}),
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
        ],
      },
      include: {
        users: { where: { userId }, take: 1 },
        translations: { orderBy: { locale: "asc" } },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });
    const roleKeys = new Set(user.roles.map(({ role }) => role.key));
    const priorityRank: Record<string, number> = {
      low: 0,
      normal: 1,
      high: 2,
      critical: 3,
    };
    return records.filter((record) => {
      if (this.effectiveStatus(record) !== "active") return false;
      const rules = this.parseRules(record.targetRulesJson);
      if (record.targetType === "users") return rules.userIds?.includes(userId) ?? false;
      if (record.targetType === "roles") return rules.roles?.some((role) => roleKeys.has(role)) ?? false;
      return true;
    }).sort((left, right) => {
      const priorityDifference = (priorityRank[right.priority] ?? 0) - (priorityRank[left.priority] ?? 0);
      if (priorityDifference) return priorityDifference;
      return (right.publishedAt?.getTime() ?? right.createdAt.getTime()) -
        (left.publishedAt?.getTime() ?? left.createdAt.getTime());
    });
  }

  private async assertEligible(userId: number, id: number) {
    const record = (await this.eligibleForUser(userId)).find((item) => item.id === id);
    if (!record) throw new NotFoundException("Không tìm thấy thông báo.");
    return record;
  }

  private async validatePayload(dto: CreateAnnouncementDto) {
    await this.languagesService.assertTranslationLocales(dto.translations.map(({ locale }) => locale));
    for (const translation of dto.translations) {
      if (/<\/?[a-z][^>]*>/i.test(translation.content)) {
        throw new BadRequestException("Nội dung không chấp nhận HTML tự do. Hãy dùng định dạng văn bản an toàn.");
      }
    }
    if (dto.startsAt && dto.endsAt && new Date(dto.endsAt) <= new Date(dto.startsAt)) {
      throw new BadRequestException("Thời gian kết thúc phải sau thời gian bắt đầu.");
    }
    if (dto.actionUrl && !this.isSafeActionUrl(dto.actionUrl)) {
      throw new BadRequestException("URL hành động phải là đường dẫn nội bộ hoặc HTTPS hợp lệ.");
    }
    const hasActionUrl = Boolean(dto.actionUrl?.trim());
    for (const translation of dto.translations) {
      if (Boolean(translation.actionLabel?.trim()) !== hasActionUrl) {
        throw new BadRequestException("Mỗi bản dịch phải có nhãn hành động khi URL hành động được nhập.");
      }
    }
    if (dto.displayType === "modal" && !dto.isDismissible && !dto.requiresAcknowledgement) {
      throw new BadRequestException("Modal không cho phép đóng phải yêu cầu người dùng xác nhận.");
    }
    if (dto.targetType === "users") {
      const ids = dto.targetRules.userIds || [];
      if (!ids.length) throw new BadRequestException("Hãy chọn ít nhất một người dùng.");
      const count = await this.prisma.user.count({ where: { id: { in: ids } } });
      if (count !== ids.length) throw new BadRequestException("Một hoặc nhiều người dùng không tồn tại.");
    }
    if (dto.targetType === "roles") {
      const roles = dto.targetRules.roles || [];
      if (!roles.length) throw new BadRequestException("Hãy chọn ít nhất một role.");
      const count = await this.prisma.role.count({ where: { key: { in: roles } } });
      if (count !== roles.length) throw new BadRequestException("Một hoặc nhiều role không tồn tại.");
    }
    return this.languagesService.getDefaultLocale();
  }

  private dataFromDto(
    dto: CreateAnnouncementDto,
    defaultTranslation: Translation,
    replaceTranslations = false,
  ) {
    return {
      // Legacy columns are kept populated during the transition. Runtime reads
      // use translations, so this is only a safe compatibility fallback.
      title: defaultTranslation.title,
      summary: this.emptyToNull(defaultTranslation.summary),
      content: defaultTranslation.content,
      type: dto.type,
      priority: dto.priority,
      displayType: dto.displayType,
      targetType: dto.targetType,
      targetRulesJson: JSON.stringify(this.normalizeRules(dto.targetType, dto.targetRules)),
      actionLabel: this.emptyToNull(defaultTranslation.actionLabel),
      actionUrl: this.emptyToNull(dto.actionUrl),
      isDismissible: dto.isDismissible,
      requiresAcknowledgement: dto.requiresAcknowledgement,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
      translations: {
        ...(replaceTranslations ? { deleteMany: {} } : {}),
        create: this.normalizeTranslations(dto.translations),
      },
    };
  }

  private mergeForValidation(existing: AdminAnnouncement, dto: UpdateAnnouncementDto): CreateAnnouncementDto {
    return {
      translations: dto.translations ?? existing.translations.map((translation) => ({
        locale: translation.locale,
        title: translation.title,
        summary: translation.summary ?? undefined,
        content: translation.content,
        actionLabel: translation.actionLabel ?? undefined,
      })),
      slug: dto.slug ?? existing.slug,
      type: (dto.type ?? existing.type) as CreateAnnouncementDto["type"],
      priority: (dto.priority ?? existing.priority) as CreateAnnouncementDto["priority"],
      displayType: (dto.displayType ?? existing.displayType) as CreateAnnouncementDto["displayType"],
      status: (dto.status ?? existing.status) as CreateAnnouncementDto["status"],
      targetType: (dto.targetType ?? existing.targetType) as CreateAnnouncementDto["targetType"],
      targetRules: dto.targetRules ?? this.parseRules(existing.targetRulesJson),
      actionUrl: dto.actionUrl ?? existing.actionUrl ?? undefined,
      isDismissible: dto.isDismissible ?? existing.isDismissible,
      requiresAcknowledgement: dto.requiresAcknowledgement ?? existing.requiresAcknowledgement,
      startsAt: dto.startsAt !== undefined ? dto.startsAt : existing.startsAt?.toISOString(),
      endsAt: dto.endsAt !== undefined ? dto.endsAt : existing.endsAt?.toISOString(),
    };
  }

  private normalizeTranslations(translations: AnnouncementTranslationDto[]): Translation[] {
    return translations.map((translation) => ({
      locale: translation.locale.trim(),
      title: translation.title.trim(),
      summary: this.emptyToNull(translation.summary) ?? undefined,
      content: translation.content.trim(),
      actionLabel: this.emptyToNull(translation.actionLabel) ?? undefined,
    }));
  }

  private defaultTranslation(translations: AnnouncementTranslationDto[], defaultLocale: string): Translation {
    const translation = this.normalizeTranslations(translations).find(({ locale }) => locale === defaultLocale);
    if (!translation) throw new BadRequestException(`Thiếu bản dịch bắt buộc cho locale mặc định "${defaultLocale}".`);
    return translation;
  }

  private normalizeRules(targetType: string, rules: TargetRules): TargetRules {
    if (targetType === "users") return { userIds: [...new Set(rules.userIds || [])] };
    if (targetType === "roles") return { roles: [...new Set((rules.roles || []).map((role) => role.trim()).filter(Boolean))] };
    return {};
  }

  private parseRules(value: string): TargetRules {
    try {
      const parsed = JSON.parse(value) as TargetRules;
      return {
        userIds: Array.isArray(parsed.userIds) ? parsed.userIds.filter(Number.isInteger) : undefined,
        roles: Array.isArray(parsed.roles) ? parsed.roles.filter((role): role is string => typeof role === "string") : undefined,
      };
    } catch {
      return {};
    }
  }

  private effectiveStatus(record: Pick<Announcement, "status" | "startsAt" | "endsAt">): AnnouncementStatus {
    if (record.status === "draft" || record.status === "paused") return record.status;
    const now = new Date();
    if (record.endsAt && record.endsAt <= now) return "expired";
    if (record.startsAt && record.startsAt > now) return "scheduled";
    return "active";
  }

  private async toAdminResponse(record: AdminAnnouncement) {
    const rules = this.parseRules(record.targetRulesJson);
    const analytics = {
      eligible: await this.recipientCount(record.targetType, rules),
      seen: record.users.filter(({ seenAt }) => seenAt).length,
      read: record.users.filter(({ readAt }) => readAt).length,
      dismissed: record.users.filter(({ dismissedAt }) => dismissedAt).length,
      acknowledged: record.users.filter(({ acknowledgedAt }) => acknowledgedAt).length,
      clicked: record.users.filter(({ ctaClickedAt }) => ctaClickedAt).length,
    };
    const rateBase = analytics.eligible || 1;
    const defaultLocale = await this.languagesService.getDefaultLocale();
    const translation = this.selectTranslation(record.translations, defaultLocale, defaultLocale);
    return {
      ...record,
      title: translation?.title ?? record.title,
      summary: translation?.summary ?? record.summary,
      content: translation?.content ?? record.content,
      actionLabel: translation?.actionLabel ?? record.actionLabel,
      status: this.effectiveStatus(record),
      targetRules: rules,
      analytics: {
        ...analytics,
        readRate: analytics.eligible ? Math.round((analytics.read / rateBase) * 10_000) / 100 : 0,
        clickRate: analytics.eligible ? Math.round((analytics.clicked / rateBase) * 10_000) / 100 : 0,
      },
      users: undefined,
    };
  }

  private toMemberResponse(record: MemberAnnouncement, locale: string | undefined, defaultLocale: string) {
    const state = record.users[0];
    const translation = this.selectTranslation(record.translations, locale, defaultLocale);
    return {
      id: record.id,
      slug: record.slug,
      locale: translation?.locale ?? defaultLocale,
      title: translation?.title ?? record.title,
      summary: translation?.summary ?? record.summary,
      content: translation?.content ?? record.content,
      type: record.type,
      priority: record.priority,
      displayType: record.displayType,
      actionLabel: translation?.actionLabel ?? record.actionLabel,
      actionUrl: record.actionUrl,
      isDismissible: record.isDismissible,
      requiresAcknowledgement: record.requiresAcknowledgement,
      startsAt: record.startsAt,
      endsAt: record.endsAt,
      publishedAt: record.publishedAt,
      createdAt: record.createdAt,
      state: {
        seenAt: state?.seenAt ?? null,
        readAt: state?.readAt ?? null,
        dismissedAt: state?.dismissedAt ?? null,
        acknowledgedAt: state?.acknowledgedAt ?? null,
        ctaClickedAt: state?.ctaClickedAt ?? null,
      },
    };
  }

  private selectTranslation<T extends Translation>(translations: T[], locale: string | undefined, defaultLocale: string) {
    const requested = locale?.trim();
    const candidates = [
      requested,
      requested?.split("-")[0],
      defaultLocale,
      defaultLocale.split("-")[0],
    ].filter((value): value is string => Boolean(value));
    for (const candidate of [...new Set(candidates)]) {
      const translation = translations.find(({ locale: translationLocale }) => translationLocale === candidate);
      if (translation) return translation;
    }
    return translations[0];
  }

  private async recipientCount(targetType: string, rules: TargetRules) {
    if (targetType === "users") {
      return this.prisma.user.count({ where: { id: { in: rules.userIds || [] }, status: "active" } });
    }
    if (targetType === "roles") {
      return this.prisma.user.count({
        where: { status: "active", roles: { some: { role: { key: { in: rules.roles || [] } } } } },
      });
    }
    return this.prisma.user.count({ where: { status: "active" } });
  }

  private async findRecord(id: number) {
    const record = await this.prisma.announcement.findFirst({
      where: { id, deletedAt: null },
      include: adminInclude,
    });
    if (!record) throw new NotFoundException("Không tìm thấy thông báo.");
    return record;
  }

  private adminStatusWhere(status: AnnouncementStatus | undefined, now: Date): Prisma.AnnouncementWhereInput {
    if (!status) return {};
    if (status === "draft" || status === "paused") return { status };
    if (status === "expired") {
      return { status: { in: ["active", "scheduled"] }, endsAt: { lte: now } };
    }
    if (status === "scheduled") {
      return {
        status: { in: ["active", "scheduled"] },
        startsAt: { gt: now },
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      };
    }
    return {
      status: { in: ["active", "scheduled"] },
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
      ],
    };
  }

  private async uniqueSlug(value: string, excludingId?: number) {
    const base = this.slugify(value) || `announcement-${Date.now()}`;
    let slug = base;
    let suffix = 1;
    while (await this.prisma.announcement.findFirst({
      where: { slug, ...(excludingId ? { id: { not: excludingId } } : {}) },
      select: { id: true },
    })) {
      slug = `${base}-${suffix++}`;
    }
    return slug;
  }

  private slugify(value: string) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  private isSafeActionUrl(value: string) {
    if (value.startsWith("/") && !value.startsWith("//")) return true;
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }

  private emptyToNull(value?: string | null) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }
}
