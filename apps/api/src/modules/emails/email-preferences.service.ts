import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";
import { AuditService, type AuditRequestContext } from "../audit/audit.service";
import type {
  CreateEmailPreferenceTopicDto,
  UpdateEmailPreferenceTopicDto,
} from "./dto/email-preferences.dto";
import { assertPreferenceChangeAllowed } from "./email-preferences.policy";

@Injectable()
export class EmailPreferencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list() {
    const topics = await this.prisma.emailPreferenceTopic.findMany({
      orderBy: [{ displayOrder: "asc" }, { id: "asc" }],
      include: {
        preferences: { select: { isSubscribed: true } },
      },
    });
    return topics.map(({ preferences, ...topic }) => ({
      ...topic,
      optedIn: preferences.filter((preference) => preference.isSubscribed).length,
      optedOut: preferences.filter((preference) => !preference.isSubscribed).length,
      hasPreferenceData: preferences.length > 0,
    }));
  }

  async create(
    dto: CreateEmailPreferenceTopicDto,
    actorUserId: number,
    context: AuditRequestContext,
  ) {
    if (dto.category === "marketing" && dto.isRequired) {
      throw new BadRequestException("Topic marketing không được đánh dấu bắt buộc.");
    }
    if (dto.isRequired && !dto.isEnabled) {
      throw new BadRequestException("Topic bắt buộc phải được bật.");
    }
    return this.prisma.$transaction(async (transaction) => {
      const topic = await transaction.emailPreferenceTopic.create({ data: dto });
      await this.audit.record(
        {
          actorUserId,
          action: "email.preference_topic.created",
          resourceType: "email_preference_topic",
          resourceId: topic.id,
          newData: this.auditData(topic),
          ...context,
        },
        transaction,
      );
      return topic;
    });
  }

  async update(
    id: number,
    dto: UpdateEmailPreferenceTopicDto,
    actorUserId: number,
    context: AuditRequestContext,
  ) {
    const current = await this.record(id);
    if (current.isRequired && dto.isEnabled === false) {
      throw new BadRequestException("Không thể tắt topic bắt buộc.");
    }
    return this.prisma.$transaction(async (transaction) => {
      const topic = await transaction.emailPreferenceTopic.update({
        where: { id },
        data: {
          name: dto.name?.trim(),
          description: dto.description?.trim(),
          isEnabled: dto.isEnabled,
          displayOrder: dto.displayOrder,
        },
      });
      await this.audit.record(
        {
          actorUserId,
          action: "email.preference_topic.updated",
          resourceType: "email_preference_topic",
          resourceId: topic.id,
          previousData: this.auditData(current),
          newData: this.auditData(topic),
          ...context,
        },
        transaction,
      );
      return topic;
    });
  }

  async getForUser(userId: number) {
    const topics = await this.prisma.emailPreferenceTopic.findMany({
      where: { isEnabled: true },
      orderBy: [{ displayOrder: "asc" }, { id: "asc" }],
      include: { preferences: { where: { userId }, take: 1 } },
    });
    return topics.map(({ preferences, ...topic }) => ({
      ...topic,
      isSubscribed:
        topic.isRequired || topic.category === "transactional"
          ? true
          : (preferences[0]?.isSubscribed ?? false),
      source: preferences[0]?.source || "default",
    }));
  }

  async changeForUser(input: {
    userId: number;
    topicId: number;
    isSubscribed: boolean;
    source:
      | "default"
      | "user_settings"
      | "unsubscribe_link"
      | "admin"
      | "import";
    actorUserId?: number | null;
    context?: AuditRequestContext;
  }) {
    const topic = await this.record(input.topicId);
    assertPreferenceChangeAllowed({
      category: topic.category,
      isRequired: topic.isRequired,
      isSubscribed: input.isSubscribed,
    });
    return this.prisma.$transaction(async (transaction) => {
      const preference = await transaction.userEmailPreference.upsert({
        where: {
          userId_topicId: { userId: input.userId, topicId: input.topicId },
        },
        update: {
          isSubscribed: input.isSubscribed,
          source: input.source,
          changedAt: new Date(),
        },
        create: {
          userId: input.userId,
          topicId: input.topicId,
          isSubscribed: input.isSubscribed,
          source: input.source,
        },
      });
      await this.audit.record(
        {
          actorUserId: input.actorUserId,
          action: "email.user_preference.changed",
          resourceType: "user_email_preference",
          resourceId: preference.id,
          newData: {
            userId: input.userId,
            topicId: input.topicId,
            isSubscribed: input.isSubscribed,
            source: input.source,
          },
          ...(input.context || {}),
        },
        transaction,
      );
      return preference;
    });
  }

  private async record(id: number) {
    const topic = await this.prisma.emailPreferenceTopic.findUnique({ where: { id } });
    if (!topic) throw new NotFoundException("Không tìm thấy email preference topic.");
    return topic;
  }

  private auditData(topic: {
    id: number;
    code: string;
    name: string;
    description: string;
    category: string;
    isRequired: boolean;
    isEnabled: boolean;
    displayOrder: number;
  }): Prisma.InputJsonObject {
    return {
      id: topic.id,
      code: topic.code,
      name: topic.name,
      description: topic.description,
      category: topic.category,
      isRequired: topic.isRequired,
      isEnabled: topic.isEnabled,
      displayOrder: topic.displayOrder,
    };
  }
}
