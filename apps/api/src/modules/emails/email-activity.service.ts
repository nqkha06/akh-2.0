import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";
import type {
  EmailOverviewQueryDto,
  ListEmailActivityQueryDto,
} from "./dto/email-activity.dto";
import { EmailSettingsService } from "./email-settings.service";

const activityInclude = {
  user: { select: { id: true, name: true, email: true, status: true } },
  template: { select: { id: true, code: true, name: true, category: true } },
  sender: {
    select: { id: true, emailAddress: true, displayName: true, type: true },
  },
} satisfies Prisma.EmailMessageInclude;

@Injectable()
export class EmailActivityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly settingsService: EmailSettingsService,
  ) {}

  async list(query: ListEmailActivityQueryDto) {
    const search = query.search?.trim();
    const numericUserId = search && /^\d+$/.test(search) ? Number(search) : null;
    const where: Prisma.EmailMessageWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { emailType: query.type } : {}),
      ...(query.templateId ? { templateId: query.templateId } : {}),
      ...(query.senderId ? { senderId: query.senderId } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            createdAt: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { recipientEmail: { contains: search } },
              { providerMessageId: { contains: search } },
              { subject: { contains: search } },
              ...(numericUserId ? [{ userId: numericUserId }] : []),
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.emailMessage.findMany({
        where,
        include: activityInclude,
        orderBy: [{ createdAt: "desc" }],
        skip: (query.page - 1) * query.perPage,
        take: query.perPage,
      }),
      this.prisma.emailMessage.count({ where }),
    ]);
    return {
      items,
      pagination: {
        page: query.page,
        perPage: query.perPage,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.perPage)),
      },
    };
  }

  async find(id: string, includeRaw: boolean) {
    const message = await this.prisma.emailMessage.findUnique({
      where: { id },
      include: {
        ...activityInclude,
        events: { orderBy: { occurredAt: "asc" } },
      },
    });
    if (!message) throw new NotFoundException("Không tìm thấy email activity.");
    const debugEnabled = this.config.get<string>("EMAIL_DEBUG_MODE") === "true";
    const exposeRaw = includeRaw && debugEnabled;
    return {
      ...message,
      events: message.events.map((event) => ({
        id: event.id,
        eventType: event.eventType,
        providerEventId: event.providerEventId,
        occurredAt: event.occurredAt,
        createdAt: event.createdAt,
        payload: exposeRaw ? event.payload : undefined,
      })),
      rawProviderEventsAvailable: debugEnabled,
      rawProviderEventsIncluded: exposeRaw,
    };
  }

  async overview(query: EmailOverviewQueryDto) {
    const { from, to } = this.range(query);
    const typeWhere =
      query.mailType === "all"
        ? { emailType: { in: ["transactional", "marketing"] } }
        : { emailType: query.mailType };
    const where: Prisma.EmailMessageWhereInput = {
      ...typeWhere,
      createdAt: { gte: from, lte: to },
    };
    const [messages, settings, defaults, criticalEvents, unsubscribes] =
      await Promise.all([
        this.prisma.emailMessage.findMany({
          where,
          select: {
            id: true,
            templateId: true,
            status: true,
            sentAt: true,
            deliveredAt: true,
            bouncedAt: true,
            complainedAt: true,
            createdAt: true,
          },
        }),
        this.settingsService.get(),
        this.prisma.emailSender.findMany({
          where: { isDefault: true, deletedAt: null },
          select: {
            id: true,
            type: true,
            emailAddress: true,
            displayName: true,
            status: true,
            domain: true,
            verifiedAt: true,
          },
        }),
        this.prisma.emailMessageEvent.findMany({
          where: {
            occurredAt: { gte: from, lte: to },
            eventType: {
              in: [
                "complaint",
                "hard_bounce",
                "provider_rejection",
                "test_send_failure",
              ],
            },
          },
          orderBy: { occurredAt: "desc" },
          take: 10,
          include: {
            emailMessage: {
              select: {
                id: true,
                recipientEmail: true,
                subject: true,
                failureCode: true,
                failureMessage: true,
              },
            },
          },
        }),
        query.mailType === "transactional"
          ? Promise.resolve(0)
          : this.prisma.userEmailPreference.count({
              where: {
                isSubscribed: false,
                source: "unsubscribe_link",
                changedAt: { gte: from, lte: to },
              },
            }),
      ]);
    const templateIds = [
      ...new Set(messages.flatMap((message) => (message.templateId ? [message.templateId] : []))),
    ];
    const templates = templateIds.length
      ? await this.prisma.emailTemplate.findMany({
          where: { id: { in: templateIds } },
          select: { id: true, code: true, name: true },
        })
      : [];
    const templateMap = new Map(templates.map((template) => [template.id, template]));
    const metrics = this.metrics(messages, unsubscribes);
    return {
      range: query.range,
      mailType: query.mailType,
      period: { from, to },
      dataAvailability: {
        hasActivity: messages.length > 0,
        message:
          messages.length > 0
            ? null
            : "Chưa đủ dữ liệu email trong khoảng thời gian này.",
      },
      metrics,
      reputation: {
        status:
          metrics.bounceRate > 5 || metrics.complaintRate > 0.1
            ? "warning"
            : "healthy",
        message:
          metrics.bounceRate > 5 || metrics.complaintRate > 0.1
            ? "Bounce hoặc complaint đang vượt ngưỡng khuyến nghị."
            : null,
      },
      health: {
        sesConfiguration: settings.providerHealth,
        domainAuthentication: this.domainHealth(defaults),
        defaultTransactionalSender:
          defaults.find((sender) => sender.type === "transactional") || null,
        defaultMarketingSender:
          defaults.find((sender) => sender.type === "marketing") || null,
        transactionalEnabled: settings.transactionalEnabled,
        marketingEnabled: settings.marketingEnabled,
      },
      deliveryTrend: messages.length
        ? this.deliveryTrend(from, to, messages)
        : [],
      topTemplates: this.topTemplates(messages, templateMap),
      recentCriticalEvents: criticalEvents.map((event) => ({
        id: event.id,
        type: event.eventType,
        occurredAt: event.occurredAt,
        message: event.emailMessage,
      })),
    };
  }

  private range(query: EmailOverviewQueryDto) {
    const to = query.range === "custom" && query.dateTo
      ? new Date(query.dateTo)
      : new Date();
    let from: Date;
    if (query.range === "custom") {
      if (!query.dateFrom || !query.dateTo) {
        throw new BadRequestException("Custom range yêu cầu dateFrom và dateTo.");
      }
      from = new Date(query.dateFrom);
    } else {
      const days = query.range === "7d" ? 7 : query.range === "90d" ? 90 : 30;
      from = new Date(to);
      from.setUTCDate(from.getUTCDate() - days + 1);
      from.setUTCHours(0, 0, 0, 0);
    }
    if (from > to) throw new BadRequestException("dateFrom phải trước dateTo.");
    if (to.getTime() - from.getTime() > 366 * 86_400_000) {
      throw new BadRequestException("Khoảng thời gian tối đa là 366 ngày.");
    }
    return { from, to };
  }

  private metrics(
    messages: Array<{
      status: string;
      sentAt: Date | null;
      deliveredAt: Date | null;
      bouncedAt: Date | null;
      complainedAt: Date | null;
    }>,
    unsubscribes: number,
  ) {
    const sent = messages.filter((message) => message.sentAt).length;
    const delivered = messages.filter(
      (message) =>
        message.deliveredAt || ["delivered", "opened", "clicked"].includes(message.status),
    ).length;
    const failed = messages.filter((message) => message.status === "failed").length;
    const bounced = messages.filter(
      (message) => message.bouncedAt || message.status === "bounced",
    ).length;
    const complaints = messages.filter(
      (message) => message.complainedAt || message.status === "complained",
    ).length;
    return {
      totalSent: sent,
      delivered,
      failed,
      bounced,
      complaints,
      unsubscribes,
      deliveryRate: this.rate(delivered, sent),
      bounceRate: this.rate(bounced, sent),
      complaintRate: this.rate(complaints, sent),
    };
  }

  private rate(value: number, total: number) {
    return total ? Number(((value / total) * 100).toFixed(2)) : 0;
  }

  private domainHealth(
    defaults: Array<{ status: string; verifiedAt: Date | null }>,
  ) {
    if (!defaults.length) return { status: "pending", message: "Chưa cấu hình sender." };
    if (defaults.some((sender) => sender.status === "failed")) {
      return { status: "failed", message: "Có sender xác minh thất bại." };
    }
    if (defaults.every((sender) => sender.status === "verified")) {
      return { status: "verified", message: "Default sender đã verified." };
    }
    return { status: "pending", message: "Đang chờ xác minh DNS." };
  }

  private deliveryTrend(
    from: Date,
    to: Date,
    messages: Array<{
      status: string;
      sentAt: Date | null;
      deliveredAt: Date | null;
      bouncedAt: Date | null;
      complainedAt: Date | null;
      createdAt: Date;
    }>,
  ) {
    const byDate = new Map<string, { sent: number; delivered: number; failed: number; bounced: number; complaints: number }>();
    for (const message of messages) {
      const key = message.createdAt.toISOString().slice(0, 10);
      const point = byDate.get(key) || { sent: 0, delivered: 0, failed: 0, bounced: 0, complaints: 0 };
      if (message.sentAt) point.sent += 1;
      if (message.deliveredAt || ["delivered", "opened", "clicked"].includes(message.status)) point.delivered += 1;
      if (message.status === "failed") point.failed += 1;
      if (message.bouncedAt || message.status === "bounced") point.bounced += 1;
      if (message.complainedAt || message.status === "complained") point.complaints += 1;
      byDate.set(key, point);
    }
    const days = Math.floor((to.getTime() - from.getTime()) / 86_400_000) + 1;
    return Array.from({ length: days }, (_, index) => {
      const date = new Date(from);
      date.setUTCDate(from.getUTCDate() + index);
      const key = date.toISOString().slice(0, 10);
      return { date: key, ...(byDate.get(key) || { sent: 0, delivered: 0, failed: 0, bounced: 0, complaints: 0 }) };
    });
  }

  private topTemplates(
    messages: Array<{ templateId: number | null; status: string }>,
    templates: Map<number, { id: number; code: string; name: string }>,
  ) {
    const groups = new Map<number, { sent: number; failed: number }>();
    for (const message of messages) {
      if (!message.templateId) continue;
      const group = groups.get(message.templateId) || { sent: 0, failed: 0 };
      group.sent += 1;
      if (["failed", "bounced", "complained"].includes(message.status)) group.failed += 1;
      groups.set(message.templateId, group);
    }
    return [...groups.entries()]
      .map(([templateId, group]) => ({
        template: templates.get(templateId) || { id: templateId, code: "deleted", name: "Template đã xóa" },
        sent: group.sent,
        failures: group.failed,
        failureRate: this.rate(group.failed, group.sent),
      }))
      .sort((left, right) => right.sent - left.sent)
      .slice(0, 5);
  }
}
