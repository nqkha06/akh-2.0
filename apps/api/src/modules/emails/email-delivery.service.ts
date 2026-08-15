import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";
import { AuditService, type AuditRequestContext } from "../audit/audit.service";
import type { EmailTemplateVariableDto } from "./dto/email-templates.dto";
import { EmailSettingsService } from "./email-settings.service";
import {
  buildTemplateSample,
  renderTemplateContent,
} from "./email-template.policy";
import type { EmailCategory, EmailProviderName } from "./email.constants";
import { EmailProviderError } from "./providers/email-provider.errors";
import { EmailProviderFactory } from "./providers/email-provider.factory";

export type TestableTemplate = {
  id: number;
  code: string;
  category: string;
  status: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: Prisma.JsonValue;
  version: number;
  senderId: number | null;
};

@Injectable()
export class EmailDeliveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: EmailSettingsService,
    private readonly providers: EmailProviderFactory,
    private readonly audit: AuditService,
  ) {}

  async sendTemplateTest(input: {
    template: TestableTemplate;
    recipientEmail: string;
    sampleData?: Record<string, unknown>;
    actorUserId: number;
    context: AuditRequestContext;
  }) {
    const settings = await this.settingsService.runtime();
    const category = input.template.category as EmailCategory;
    if (
      (category === "transactional" && !settings.transactionalEnabled) ||
      (category === "marketing" && !settings.marketingEnabled)
    ) {
      throw new BadRequestException(
        `Luồng email ${category === "marketing" ? "marketing" : "transactional"} đang tạm dừng.`,
      );
    }
    const provider = this.providers.get(settings.provider as EmailProviderName);
    const health = await provider.checkConnection();
    if (health.status !== "configured") {
      throw new BadRequestException(health.message);
    }

    const sender = await this.resolveSender(input.template.senderId, category);
    const variables = input.template.variables as unknown as EmailTemplateVariableDto[];
    const sample = buildTemplateSample(variables, input.sampleData);
    const rendered = {
      subject: renderTemplateContent(input.template.subject, sample),
      html: renderTemplateContent(input.template.htmlContent, sample),
      text: renderTemplateContent(input.template.textContent, sample),
    };
    const message = await this.prisma.emailMessage.create({
      data: {
        templateId: input.template.id,
        templateVersion: input.template.version,
        senderId: sender.id,
        provider: settings.provider,
        recipientEmail: input.recipientEmail.trim().toLowerCase(),
        fromEmail: sender.emailAddress!,
        replyToEmail: sender.replyToEmail || settings.globalReplyToEmail,
        subject: rendered.subject,
        emailType: "test",
        category,
        status: "sending",
        queuedAt: new Date(),
        metadata: {
          templateCode: input.template.code,
          initiatedBy: input.actorUserId,
        },
      },
    });

    try {
      const result = await provider.sendTestEmail({
        messageId: message.id,
        fromEmail: sender.emailAddress!,
        fromName: sender.displayName,
        replyToEmail: sender.replyToEmail || settings.globalReplyToEmail,
        recipientEmail: message.recipientEmail,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        type: "test",
        templateCode: input.template.code,
        templateVersion: input.template.version,
      });
      const updated = await this.prisma.$transaction(async (transaction) => {
        const next = await transaction.emailMessage.update({
          where: { id: message.id },
          data: {
            providerMessageId: result.providerMessageId,
            status: "sent",
            sentAt: result.acceptedAt,
          },
        });
        await transaction.emailMessageEvent.create({
          data: {
            emailMessageId: message.id,
            eventType: "send",
            providerEventId: `send:${result.providerMessageId}`,
            payload: {
              providerMessageId: result.providerMessageId,
              source: "test_send",
            },
            occurredAt: result.acceptedAt,
          },
        });
        await this.audit.record(
          {
            actorUserId: input.actorUserId,
            action: "email.test.sent",
            resourceType: "email_message",
            resourceId: message.id,
            newData: {
              templateId: input.template.id,
              templateVersion: input.template.version,
              senderId: sender.id,
              recipientEmail: message.recipientEmail,
              status: "sent",
            },
            ...input.context,
          },
          transaction,
        );
        return next;
      });
      return updated;
    } catch (error) {
      const mapped =
        error instanceof EmailProviderError
          ? error
          : new EmailProviderError(
              "Không thể gửi email test qua provider.",
              "TEST_SEND_FAILED",
            );
      await this.prisma.$transaction(async (transaction) => {
        await transaction.emailMessage.update({
          where: { id: message.id },
          data: {
            status: "failed",
            failureCode: mapped.code,
            failureMessage: mapped.message,
          },
        });
        await transaction.emailMessageEvent.create({
          data: {
            emailMessageId: message.id,
            eventType: "test_send_failure",
            payload: { code: mapped.code, message: mapped.message },
            occurredAt: new Date(),
          },
        });
        await this.audit.record(
          {
            actorUserId: input.actorUserId,
            action: "email.test.failed",
            resourceType: "email_message",
            resourceId: message.id,
            newData: {
              templateId: input.template.id,
              recipientEmail: message.recipientEmail,
              status: "failed",
              failureCode: mapped.code,
            },
            ...input.context,
          },
          transaction,
        );
      });
      throw new BadRequestException(mapped.message);
    }
  }

  private async resolveSender(senderId: number | null, category: EmailCategory) {
    const sender = await this.prisma.emailSender.findFirst({
      where: senderId
        ? { id: senderId, deletedAt: null }
        : { type: category, isDefault: true, deletedAt: null },
    });
    if (!sender) {
      throw new BadRequestException(
        "Chưa cấu hình sender cho loại email này.",
      );
    }
    if (sender.type !== category || sender.status !== "verified" || !sender.emailAddress) {
      throw new BadRequestException(
        "Sender phải đúng loại, có email From và đã được verified.",
      );
    }
    return sender;
  }
}
