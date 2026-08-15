import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../../database/prisma/prisma.service";
import type { SnsEnvelope } from "./sns-signature-verifier";
import { SnsSignatureVerifier } from "./sns-signature-verifier";

type SesNotification = {
  notificationType?: string;
  eventType?: string;
  mail?: {
    messageId?: string;
    timestamp?: string;
    tags?: Record<string, string[]>;
    destination?: string[];
  };
  delivery?: { timestamp?: string };
  bounce?: {
    timestamp?: string;
    bounceType?: string;
    bouncedRecipients?: Array<{ emailAddress?: string; diagnosticCode?: string }>; 
  };
  complaint?: {
    timestamp?: string;
    complainedRecipients?: Array<{ emailAddress?: string }>;
    complaintFeedbackType?: string;
  };
  open?: { timestamp?: string };
  click?: { timestamp?: string; link?: string };
  reject?: { reason?: string };
  failure?: { errorMessage?: string; templateName?: string };
};

const statusRank: Record<string, number> = {
  queued: 0,
  sending: 1,
  sent: 2,
  delivered: 3,
  opened: 4,
  clicked: 5,
  failed: 90,
  bounced: 100,
  complained: 110,
  suppressed: 120,
  cancelled: 120,
};

@Injectable()
export class SesWebhookService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly signatures: SnsSignatureVerifier,
  ) {}

  async handle(input: unknown) {
    const envelope = this.envelope(input);
    await this.signatures.verify(envelope);
    if (envelope.Type === "SubscriptionConfirmation") {
      if (!envelope.SubscribeURL) {
        throw new BadRequestException("AWS SNS SubscribeURL bị thiếu.");
      }
      const response = await fetch(envelope.SubscribeURL, { method: "GET" });
      if (!response.ok) {
        throw new BadRequestException("Không thể xác nhận AWS SNS subscription.");
      }
      return { accepted: true, subscriptionConfirmed: true };
    }
    if (envelope.Type !== "Notification") {
      return { accepted: true, ignored: true };
    }

    const notification = this.notification(envelope.Message);
    const eventType = this.eventType(notification);
    const message = await this.findMessage(notification);
    if (!message) {
      return { accepted: true, matched: false, eventType };
    }
    const existing = await this.prisma.emailMessageEvent.findUnique({
      where: {
        providerEventId_eventType: {
          providerEventId: envelope.MessageId,
          eventType,
        },
      },
    });
    if (existing) return { accepted: true, duplicate: true, eventId: existing.id };

    const occurredAt = this.occurredAt(notification);
    const nextStatus = this.nextStatus(message.status, eventType);
    try {
      const event = await this.prisma.$transaction(async (transaction) => {
        const created = await transaction.emailMessageEvent.create({
          data: {
            emailMessageId: message.id,
            eventType,
            providerEventId: envelope.MessageId,
            payload: notification as unknown as Prisma.InputJsonValue,
            occurredAt,
          },
        });
        await transaction.emailMessage.update({
          where: { id: message.id },
          data: this.messageUpdate(notification, eventType, nextStatus, occurredAt),
        });
        if (this.shouldSuppress(notification, eventType)) {
          const email = this.recipient(notification, message.recipientEmail);
          await transaction.emailSuppression.upsert({
            where: { emailAddress: email },
            update: {
              reason: eventType === "complaint" ? "complaint" : "hard_bounce",
              source: "amazon_ses",
              providerEventId: envelope.MessageId,
              lastEmailMessageId: message.id,
              suppressedAt: occurredAt,
            },
            create: {
              emailAddress: email,
              reason: eventType === "complaint" ? "complaint" : "hard_bounce",
              source: "amazon_ses",
              providerEventId: envelope.MessageId,
              lastEmailMessageId: message.id,
              suppressedAt: occurredAt,
            },
          });
        }
        return created;
      });
      return { accepted: true, matched: true, eventId: event.id, eventType };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return { accepted: true, duplicate: true };
      }
      throw error;
    }
  }

  private envelope(input: unknown): SnsEnvelope {
    let value = input;
    if (typeof value === "string") {
      try {
        value = JSON.parse(value);
      } catch {
        throw new BadRequestException("AWS SNS payload không phải JSON hợp lệ.");
      }
    }
    if (!value || typeof value !== "object") {
      throw new BadRequestException("AWS SNS payload không hợp lệ.");
    }
    return value as SnsEnvelope;
  }

  private notification(message: string): SesNotification {
    try {
      const value = JSON.parse(message) as SesNotification;
      if (!value || typeof value !== "object") throw new Error("invalid");
      return value;
    } catch {
      throw new BadRequestException("Amazon SES notification không hợp lệ.");
    }
  }

  private async findMessage(notification: SesNotification) {
    const providerMessageId = notification.mail?.messageId;
    const internalMessageId = notification.mail?.tags?.message_id?.[0];
    return this.prisma.emailMessage.findFirst({
      where: {
        OR: [
          ...(providerMessageId ? [{ providerMessageId }] : []),
          ...(internalMessageId ? [{ id: internalMessageId }] : []),
        ],
      },
    });
  }

  private eventType(notification: SesNotification) {
    const raw = (notification.eventType || notification.notificationType || "unknown").toLowerCase();
    if (raw === "bounce") {
      return notification.bounce?.bounceType?.toLowerCase() === "permanent"
        ? "hard_bounce"
        : "bounce";
    }
    const map: Record<string, string> = {
      send: "send",
      delivery: "delivery",
      complaint: "complaint",
      open: "open",
      click: "click",
      reject: "provider_rejection",
      renderingfailure: "rendering_failure",
      "rendering failure": "rendering_failure",
      subscription: "subscription",
    };
    return map[raw] || raw.replace(/\s+/g, "_");
  }

  private nextStatus(current: string, eventType: string) {
    const nextByEvent: Record<string, string> = {
      send: "sent",
      delivery: "delivered",
      open: "opened",
      click: "clicked",
      bounce: "bounced",
      hard_bounce: "bounced",
      complaint: "complained",
      provider_rejection: "failed",
      rendering_failure: "failed",
    };
    const next = nextByEvent[eventType] || current;
    return (statusRank[next] || 0) >= (statusRank[current] || 0) ? next : current;
  }

  private messageUpdate(
    notification: SesNotification,
    eventType: string,
    status: string,
    occurredAt: Date,
  ): Prisma.EmailMessageUpdateInput {
    const update: Prisma.EmailMessageUpdateInput = { status };
    if (eventType === "send") update.sentAt = occurredAt;
    if (eventType === "delivery") update.deliveredAt = occurredAt;
    if (eventType === "open") update.openedAt = occurredAt;
    if (eventType === "click") update.clickedAt = occurredAt;
    if (["bounce", "hard_bounce"].includes(eventType)) {
      update.bouncedAt = occurredAt;
      update.failureCode = notification.bounce?.bounceType || "bounce";
      update.failureMessage =
        notification.bounce?.bouncedRecipients?.[0]?.diagnosticCode ||
        "Amazon SES ghi nhận bounce.";
    }
    if (eventType === "complaint") {
      update.complainedAt = occurredAt;
      update.failureCode = notification.complaint?.complaintFeedbackType || "complaint";
      update.failureMessage = "Amazon SES ghi nhận complaint.";
    }
    if (eventType === "provider_rejection") {
      update.failureCode = "provider_rejection";
      update.failureMessage = notification.reject?.reason || "Amazon SES từ chối email.";
    }
    if (eventType === "rendering_failure") {
      update.failureCode = "rendering_failure";
      update.failureMessage = notification.failure?.errorMessage || "Email render thất bại.";
    }
    return update;
  }

  private occurredAt(notification: SesNotification) {
    const value =
      notification.delivery?.timestamp ||
      notification.bounce?.timestamp ||
      notification.complaint?.timestamp ||
      notification.open?.timestamp ||
      notification.click?.timestamp ||
      notification.mail?.timestamp;
    const date = value ? new Date(value) : new Date();
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }

  private shouldSuppress(notification: SesNotification, eventType: string) {
    return eventType === "complaint" ||
      (eventType === "hard_bounce" && notification.bounce?.bounceType?.toLowerCase() === "permanent");
  }

  private recipient(notification: SesNotification, fallback: string) {
    return (
      notification.bounce?.bouncedRecipients?.[0]?.emailAddress ||
      notification.complaint?.complainedRecipients?.[0]?.emailAddress ||
      notification.mail?.destination?.[0] ||
      fallback
    ).trim().toLowerCase();
  }
}
