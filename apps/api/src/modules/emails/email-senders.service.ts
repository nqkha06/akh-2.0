import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";
import { AuditService, type AuditRequestContext } from "../audit/audit.service";
import type {
  CreateEmailSenderDto,
  ListEmailSendersQueryDto,
  UpdateEmailSenderDto,
} from "./dto/email-senders.dto";
import { PUBLIC_EMAIL_DOMAINS, type EmailProviderName } from "./email.constants";
import { EmailProviderError } from "./providers/email-provider.errors";
import { EmailProviderFactory } from "./providers/email-provider.factory";

const senderInclude = {
  createdBy: { select: { id: true, name: true, email: true } },
  updatedBy: { select: { id: true, name: true, email: true } },
  _count: { select: { templates: true, messages: true } },
} satisfies Prisma.EmailSenderInclude;

@Injectable()
export class EmailSendersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providers: EmailProviderFactory,
    private readonly audit: AuditService,
  ) {}

  async list(query: ListEmailSendersQueryDto) {
    const where: Prisma.EmailSenderWhereInput = {
      deletedAt: null,
      ...(query.type ? { type: query.type } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              { emailAddress: { contains: query.search.trim() } },
              { domain: { contains: query.search.trim() } },
              { displayName: { contains: query.search.trim() } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.emailSender.findMany({
        where,
        include: senderInclude,
        orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
        skip: (query.page - 1) * query.perPage,
        take: query.perPage,
      }),
      this.prisma.emailSender.count({ where }),
    ]);
    return {
      items: items.map((item) => this.response(item)),
      pagination: {
        page: query.page,
        perPage: query.perPage,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.perPage)),
      },
    };
  }

  async find(id: number) {
    return this.response(await this.record(id));
  }

  async create(
    dto: CreateEmailSenderDto,
    actorUserId: number,
    context: AuditRequestContext,
  ) {
    const normalized = this.normalize(dto);
    this.validateIdentity(normalized);
    const duplicate = await this.prisma.emailSender.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { emailAddress: normalized.emailAddress },
          { domain: normalized.domain, type: normalized.type },
        ],
      },
    });
    if (duplicate) {
      throw new BadRequestException("Sender hoặc domain này đã tồn tại.");
    }

    const sender = await this.prisma.emailSender.create({
      data: {
        ...normalized,
        provider: "amazon_ses",
        status: "draft",
        createdById: actorUserId,
        updatedById: actorUserId,
      },
      include: senderInclude,
    });
    let result: Awaited<
      ReturnType<ReturnType<EmailProviderFactory["get"]>["createOrGetIdentity"]>
    > | null = null;
    try {
      result = await this.providers
        .get(sender.provider as EmailProviderName)
        .createOrGetIdentity({ domain: sender.domain });
    } catch (error) {
      if (!(error instanceof EmailProviderError)) throw error;
      await this.prisma.emailSender.update({
        where: { id: sender.id },
        data: { verificationError: error.message, status: "draft" },
      });
    }

    const updated = await this.prisma.$transaction(async (transaction) => {
      const next = result
        ? await transaction.emailSender.update({
            where: { id: sender.id },
            data: {
              providerIdentityId: result.identity,
              status: result.status,
              dnsRecords: result.dnsRecords as unknown as Prisma.InputJsonValue,
              verificationError: result.error || null,
              verifiedAt: result.verifiedAt || null,
              lastCheckedAt: new Date(),
            },
            include: senderInclude,
          })
        : await transaction.emailSender.findUniqueOrThrow({
            where: { id: sender.id },
            include: senderInclude,
          });
      await this.audit.record(
        {
          actorUserId,
          action: "email.sender.created",
          resourceType: "email_sender",
          resourceId: sender.id,
          newData: this.auditData(next),
          ...context,
        },
        transaction,
      );
      return next;
    });
    return {
      ...this.response(updated),
      warnings: result?.warnings || this.recommendations(updated.type, updated.domain),
    };
  }

  async update(
    id: number,
    dto: UpdateEmailSenderDto,
    actorUserId: number,
    context: AuditRequestContext,
  ) {
    const current = await this.record(id);
    if (dto.status && !["draft", "disabled"].includes(dto.status)) {
      throw new BadRequestException(
        "Trạng thái xác minh chỉ được cập nhật qua Amazon SES.",
      );
    }
    if (dto.status === "disabled") await this.assertCanDisable(current);
    const updated = await this.prisma.$transaction(async (transaction) => {
      const next = await transaction.emailSender.update({
        where: { id },
        data: {
          displayName: dto.displayName?.trim(),
          replyToEmail: dto.replyToEmail?.trim().toLowerCase(),
          status: dto.status,
          isDefault: dto.status === "disabled" ? false : undefined,
          updatedById: actorUserId,
        },
        include: senderInclude,
      });
      await this.audit.record(
        {
          actorUserId,
          action:
            dto.status === "disabled"
              ? "email.sender.disabled"
              : "email.sender.updated",
          resourceType: "email_sender",
          resourceId: id,
          previousData: this.auditData(current),
          newData: this.auditData(next),
          ...context,
        },
        transaction,
      );
      return next;
    });
    return this.response(updated);
  }

  async checkVerification(
    id: number,
    actorUserId: number,
    context: AuditRequestContext,
  ) {
    const current = await this.record(id);
    if (current.status === "disabled") {
      throw new BadRequestException("Sender đã bị vô hiệu hóa.");
    }
    const result = await this.providers
      .get(current.provider as EmailProviderName)
      .getIdentityStatus(current.providerIdentityId || current.domain);
    const updated = await this.prisma.$transaction(async (transaction) => {
      const next = await transaction.emailSender.update({
        where: { id },
        data: {
          providerIdentityId: result.identity,
          status: result.status,
          dnsRecords: result.dnsRecords as unknown as Prisma.InputJsonValue,
          verificationError: result.error || null,
          verifiedAt: result.status === "verified" ? current.verifiedAt || new Date() : null,
          lastCheckedAt: new Date(),
          updatedById: actorUserId,
        },
        include: senderInclude,
      });
      await this.audit.record(
        {
          actorUserId,
          action: "email.sender.verification_checked",
          resourceType: "email_sender",
          resourceId: id,
          previousData: this.auditData(current),
          newData: this.auditData(next),
          ...context,
        },
        transaction,
      );
      return next;
    });
    return { ...this.response(updated), warnings: result.warnings };
  }

  async setDefault(
    id: number,
    actorUserId: number,
    context: AuditRequestContext,
  ) {
    const current = await this.record(id);
    if (current.status !== "verified") {
      throw new BadRequestException("Chỉ sender đã verified mới có thể đặt mặc định.");
    }
    const updated = await this.prisma.$transaction(async (transaction) => {
      const previous = await transaction.emailSender.findFirst({
        where: { type: current.type, isDefault: true, deletedAt: null },
      });
      await transaction.emailSender.updateMany({
        where: { type: current.type, isDefault: true, deletedAt: null },
        data: { isDefault: false, updatedById: actorUserId },
      });
      const next = await transaction.emailSender.update({
        where: { id },
        data: { isDefault: true, updatedById: actorUserId },
        include: senderInclude,
      });
      await this.audit.record(
        {
          actorUserId,
          action: "email.sender.default_changed",
          resourceType: "email_sender",
          resourceId: id,
          previousData: previous ? this.auditData(previous) : null,
          newData: this.auditData(next),
          ...context,
        },
        transaction,
      );
      return next;
    });
    return this.response(updated);
  }

  async remove(
    id: number,
    actorUserId: number,
    context: AuditRequestContext,
  ) {
    const current = await this.record(id);
    await this.assertCanDisable(current);
    const updated = await this.prisma.$transaction(async (transaction) => {
      const next = await transaction.emailSender.update({
        where: { id },
        data: {
          status: "disabled",
          isDefault: false,
          deletedAt: new Date(),
          updatedById: actorUserId,
        },
      });
      await this.audit.record(
        {
          actorUserId,
          action: "email.sender.deleted",
          resourceType: "email_sender",
          resourceId: id,
          previousData: this.auditData(current),
          newData: this.auditData(next),
          ...context,
        },
        transaction,
      );
      return next;
    });
    return { id: updated.id, deleted: true as const };
  }

  private async record(id: number) {
    const sender = await this.prisma.emailSender.findFirst({
      where: { id, deletedAt: null },
      include: senderInclude,
    });
    if (!sender) throw new NotFoundException("Không tìm thấy email sender.");
    return sender;
  }

  private async assertCanDisable(sender: {
    id: number;
    isDefault: boolean;
  }) {
    if (sender.isDefault) {
      throw new BadRequestException(
        "Hãy chọn sender mặc định thay thế trước khi vô hiệu hóa sender này.",
      );
    }
    const templates = await this.prisma.emailTemplate.count({
      where: { senderId: sender.id, deletedAt: null, status: { not: "archived" } },
    });
    if (templates > 0) {
      throw new BadRequestException(
        "Sender đang được template sử dụng. Hãy đổi sender cho template trước.",
      );
    }
  }

  private normalize(dto: CreateEmailSenderDto) {
    return {
      type: dto.type,
      emailAddress: dto.emailAddress.trim().toLowerCase(),
      domain: dto.domain.trim().toLowerCase().replace(/\.$/, ""),
      displayName: dto.displayName.trim(),
      replyToEmail: dto.replyToEmail?.trim().toLowerCase() || null,
    };
  }

  private validateIdentity(sender: ReturnType<EmailSendersService["normalize"]>) {
    const emailDomain = sender.emailAddress.split("@")[1];
    if (emailDomain !== sender.domain) {
      throw new BadRequestException("Email From phải thuộc đúng domain xác minh.");
    }
    if (PUBLIC_EMAIL_DOMAINS.has(sender.domain)) {
      throw new BadRequestException(
        "Không thể dùng Gmail, Yahoo hoặc public mailbox provider làm sender.",
      );
    }
    if (sender.type === "marketing" && sender.domain.split(".").length < 3) {
      throw new BadRequestException(
        "Sender marketing phải dùng subdomain riêng, ví dụ news.domain.com.",
      );
    }
  }

  private response(sender: Prisma.EmailSenderGetPayload<{ include: typeof senderInclude }>) {
    return {
      ...sender,
      recommendations: this.recommendations(sender.type, sender.domain),
    };
  }

  private recommendations(type: string, domain: string) {
    const preferredPrefix = type === "marketing" ? "news." : "notify.";
    return domain.startsWith(preferredPrefix)
      ? []
      : [`Khuyến nghị dùng subdomain ${preferredPrefix}domain.com để tách reputation.`];
  }

  private auditData(sender: {
    id: number;
    type: string;
    emailAddress: string | null;
    domain: string;
    displayName: string;
    replyToEmail: string | null;
    provider: string;
    status: string;
    isDefault: boolean;
  }): Prisma.InputJsonObject {
    return {
      id: sender.id,
      type: sender.type,
      emailAddress: sender.emailAddress,
      domain: sender.domain,
      displayName: sender.displayName,
      replyToEmail: sender.replyToEmail,
      provider: sender.provider,
      status: sender.status,
      isDefault: sender.isDefault,
    };
  }
}
