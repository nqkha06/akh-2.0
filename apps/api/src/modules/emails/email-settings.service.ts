import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { AuditService, type AuditRequestContext } from "../audit/audit.service";
import { PrismaService } from "../../database/prisma/prisma.service";
import type { UpdateEmailSettingsDto } from "./dto/email-settings.dto";
import type { EmailProviderName } from "./email.constants";
import { EmailProviderFactory } from "./providers/email-provider.factory";

@Injectable()
export class EmailSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providers: EmailProviderFactory,
    private readonly audit: AuditService,
  ) {}

  async get() {
    const settings = await this.record();
    const health = await this.providers
      .get(settings.provider as EmailProviderName)
      .checkConnection();
    return this.response(settings, health);
  }

  async update(
    dto: UpdateEmailSettingsDto,
    actorUserId: number,
    context: AuditRequestContext,
  ) {
    const current = await this.record();
    const providerName = (dto.provider || current.provider) as EmailProviderName;
    const health = await this.providers.get(providerName).checkConnection();
    const enablingTracking =
      dto.trackingEnabled || dto.openTrackingEnabled || dto.clickTrackingEnabled;
    if (enablingTracking && !health.trackingSupported) {
      throw new BadRequestException(
        "Tracking chỉ có thể bật khi SES configuration sets đã sẵn sàng.",
      );
    }
    if (
      dto.openTrackingEnabled &&
      dto.trackingEnabled === false
    ) {
      throw new BadRequestException("Bật open tracking yêu cầu bật tracking tổng.");
    }
    if (
      dto.clickTrackingEnabled &&
      dto.trackingEnabled === false
    ) {
      throw new BadRequestException("Bật click tracking yêu cầu bật tracking tổng.");
    }

    const updated = await this.prisma.$transaction(async (transaction) => {
      const next = await transaction.emailSettings.update({
        where: { id: current.id },
        data: {
          ...dto,
          providerStatus: health.status,
          awsRegion: health.region,
          globalReplyToEmail: dto.globalReplyToEmail?.trim().toLowerCase(),
          updatedById: actorUserId,
          ...(!dto.trackingEnabled
            ? dto.trackingEnabled === false
              ? { openTrackingEnabled: false, clickTrackingEnabled: false }
              : {}
            : {}),
        },
        include: { updatedBy: { select: { id: true, name: true, email: true } } },
      });
      await this.audit.record(
        {
          actorUserId,
          action: "email.settings.updated",
          resourceType: "email_settings",
          resourceId: next.id,
          previousData: this.auditData(current),
          newData: this.auditData(next),
          ...context,
        },
        transaction,
      );
      return next;
    });
    return this.response(updated, health);
  }

  async checkConnection(actorUserId: number, context: AuditRequestContext) {
    const settings = await this.record();
    const health = await this.providers
      .get(settings.provider as EmailProviderName)
      .checkConnection();
    await this.prisma.$transaction(async (transaction) => {
      await transaction.emailSettings.update({
        where: { id: settings.id },
        data: {
          providerStatus: health.status,
          awsRegion: health.region,
          updatedById: actorUserId,
        },
      });
      await this.audit.record(
        {
          actorUserId,
          action: "email.provider.connection_checked",
          resourceType: "email_settings",
          resourceId: settings.id,
          newData: {
            provider: health.provider,
            status: health.status,
            region: health.region,
            configurationSetsReady: health.configurationSetsReady,
          },
          ...context,
        },
        transaction,
      );
    });
    return health;
  }

  async runtime() {
    return this.record();
  }

  private record() {
    return this.prisma.emailSettings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
      include: { updatedBy: { select: { id: true, name: true, email: true } } },
    });
  }

  private response(
    settings: Awaited<ReturnType<EmailSettingsService["record"]>>,
    health: Awaited<ReturnType<ReturnType<EmailProviderFactory["get"]>["checkConnection"]>>,
  ) {
    return {
      id: settings.id,
      provider: settings.provider,
      providerStatus: health.status,
      awsRegion: health.region,
      defaultLocale: settings.defaultLocale,
      transactionalEnabled: settings.transactionalEnabled,
      marketingEnabled: settings.marketingEnabled,
      globalReplyToEmail: settings.globalReplyToEmail,
      trackingEnabled: settings.trackingEnabled,
      openTrackingEnabled: settings.openTrackingEnabled,
      clickTrackingEnabled: settings.clickTrackingEnabled,
      providerHealth: health,
      updatedBy: settings.updatedBy,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };
  }

  private auditData(settings: {
    provider: string;
    providerStatus: string;
    awsRegion: string | null;
    defaultLocale: string;
    transactionalEnabled: boolean;
    marketingEnabled: boolean;
    globalReplyToEmail: string | null;
    trackingEnabled: boolean;
    openTrackingEnabled: boolean;
    clickTrackingEnabled: boolean;
  }): Prisma.InputJsonObject {
    return {
      provider: settings.provider,
      providerStatus: settings.providerStatus,
      awsRegion: settings.awsRegion,
      defaultLocale: settings.defaultLocale,
      transactionalEnabled: settings.transactionalEnabled,
      marketingEnabled: settings.marketingEnabled,
      globalReplyToEmail: settings.globalReplyToEmail,
      trackingEnabled: settings.trackingEnabled,
      openTrackingEnabled: settings.openTrackingEnabled,
      clickTrackingEnabled: settings.clickTrackingEnabled,
    };
  }
}
