import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";
import { AuditService, type AuditRequestContext } from "../audit/audit.service";
import type {
  CreateEmailTemplateDto,
  EmailTemplateVariableDto,
  ListEmailTemplatesQueryDto,
  PreviewEmailTemplateDto,
  TestSendEmailTemplateDto,
  UpdateEmailTemplateDto,
} from "./dto/email-templates.dto";
import { EmailDeliveryService } from "./email-delivery.service";
import {
  buildTemplateSample,
  htmlToPlainText,
  renderTemplateContent,
  sanitizeEmailHtml,
  validateTemplateVariables,
} from "./email-template.policy";

const templateInclude = {
  sender: {
    select: {
      id: true,
      emailAddress: true,
      displayName: true,
      type: true,
      status: true,
      isDefault: true,
    },
  },
  createdBy: { select: { id: true, name: true, email: true } },
  updatedBy: { select: { id: true, name: true, email: true } },
  _count: { select: { versions: true, messages: true } },
} satisfies Prisma.EmailTemplateInclude;

type TemplateRecord = Prisma.EmailTemplateGetPayload<{
  include: typeof templateInclude;
}>;

@Injectable()
export class EmailTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly delivery: EmailDeliveryService,
    private readonly audit: AuditService,
  ) {}

  async list(query: ListEmailTemplatesQueryDto) {
    const where: Prisma.EmailTemplateWhereInput = {
      deletedAt: null,
      ...(query.category ? { category: query.category } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              { name: { contains: query.search.trim() } },
              { code: { contains: query.search.trim() } },
              { subject: { contains: query.search.trim() } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.emailTemplate.findMany({
        where,
        include: templateInclude,
        orderBy: [{ updatedAt: "desc" }],
        skip: (query.page - 1) * query.perPage,
        take: query.perPage,
      }),
      this.prisma.emailTemplate.count({ where }),
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
    dto: CreateEmailTemplateDto,
    actorUserId: number,
    context: AuditRequestContext,
  ) {
    const content = this.prepare(dto);
    await this.validateSender(dto.senderId, dto.category);
    const created = await this.prisma.$transaction(async (transaction) => {
      const template = await transaction.emailTemplate.create({
        data: {
          code: dto.code,
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
          category: dto.category,
          status: dto.status,
          subject: dto.subject.trim(),
          preheader: dto.preheader?.trim() || null,
          htmlContent: content.htmlContent,
          textContent: content.textContent,
          variables: dto.variables as unknown as Prisma.InputJsonValue,
          senderId: dto.senderId || null,
          version: 1,
          lastPublishedAt: dto.status === "active" ? new Date() : null,
          createdById: actorUserId,
          updatedById: actorUserId,
        },
        include: templateInclude,
      });
      if (dto.status === "active") {
        await this.createVersion(transaction, template, actorUserId);
      }
      await this.audit.record(
        {
          actorUserId,
          action: "email.template.created",
          resourceType: "email_template",
          resourceId: template.id,
          newData: this.auditData(template),
          ...context,
        },
        transaction,
      );
      return template;
    });
    return this.response(created);
  }

  async update(
    id: number,
    dto: UpdateEmailTemplateDto,
    actorUserId: number,
    context: AuditRequestContext,
  ) {
    const current = await this.record(id);
    const merged = {
      name: dto.name ?? current.name,
      description: dto.description === undefined ? current.description : dto.description,
      category: dto.category ?? current.category,
      status: dto.status ?? current.status,
      subject: dto.subject ?? current.subject,
      preheader: dto.preheader === undefined ? current.preheader : dto.preheader,
      htmlContent: dto.htmlContent ?? current.htmlContent,
      textContent: dto.textContent === undefined ? current.textContent : dto.textContent,
      variables: dto.variables ?? this.variables(current.variables),
      senderId: dto.senderId === undefined ? current.senderId : dto.senderId,
    };
    const content = this.prepare(merged);
    await this.validateSender(merged.senderId, merged.category);
    const shouldPublish =
      merged.status === "active" &&
      (current.status !== "active" ||
        dto.subject !== undefined ||
        dto.preheader !== undefined ||
        dto.htmlContent !== undefined ||
        dto.textContent !== undefined ||
        dto.variables !== undefined ||
        dto.senderId !== undefined);
    const restoredFromArchive =
      current.status === "archived" && merged.status !== "archived";

    const updated = await this.prisma.$transaction(async (transaction) => {
      const next = await transaction.emailTemplate.update({
        where: { id },
        data: {
          name: merged.name.trim(),
          description: merged.description?.trim() || null,
          category: merged.category,
          status: merged.status,
          subject: merged.subject.trim(),
          preheader: merged.preheader?.trim() || null,
          htmlContent: content.htmlContent,
          textContent: content.textContent,
          variables: merged.variables as unknown as Prisma.InputJsonValue,
          senderId: merged.senderId || null,
          version: shouldPublish ? { increment: 1 } : undefined,
          lastPublishedAt: shouldPublish ? new Date() : undefined,
          updatedById: actorUserId,
        },
        include: templateInclude,
      });
      if (shouldPublish) await this.createVersion(transaction, next, actorUserId);
      await this.audit.record(
        {
          actorUserId,
          action: restoredFromArchive
            ? "email.template.restored"
            : shouldPublish
              ? "email.template.published"
              : "email.template.updated",
          resourceType: "email_template",
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

  async archive(
    id: number,
    actorUserId: number,
    context: AuditRequestContext,
  ) {
    const current = await this.record(id);
    if (current.status === "archived") return this.response(current);
    const updated = await this.prisma.$transaction(async (transaction) => {
      const next = await transaction.emailTemplate.update({
        where: { id },
        data: { status: "archived", updatedById: actorUserId },
        include: templateInclude,
      });
      await this.audit.record(
        {
          actorUserId,
          action: "email.template.archived",
          resourceType: "email_template",
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

  async preview(id: number, dto: PreviewEmailTemplateDto) {
    const template = await this.record(id);
    const sampleData = buildTemplateSample(
      this.variables(template.variables),
      dto.sampleData,
    );
    return {
      templateId: template.id,
      version: template.version,
      sampleData,
      subject: renderTemplateContent(template.subject, sampleData),
      preheader: template.preheader
        ? renderTemplateContent(template.preheader, sampleData)
        : null,
      html: renderTemplateContent(template.htmlContent, sampleData),
      text: renderTemplateContent(template.textContent, sampleData),
    };
  }

  async testSend(
    id: number,
    dto: TestSendEmailTemplateDto,
    actorUserId: number,
    context: AuditRequestContext,
  ) {
    const template = await this.record(id);
    if (template.status === "archived") {
      throw new BadRequestException("Không thể gửi test template đã archive.");
    }
    return this.delivery.sendTemplateTest({
      template,
      recipientEmail: dto.recipientEmail,
      sampleData: dto.sampleData,
      actorUserId,
      context,
    });
  }

  async versions(id: number) {
    await this.record(id);
    return this.prisma.emailTemplateVersion.findMany({
      where: { templateId: id },
      orderBy: { version: "desc" },
    });
  }

  async restoreVersion(
    id: number,
    version: number,
    actorUserId: number,
    context: AuditRequestContext,
  ) {
    const current = await this.record(id);
    const snapshot = await this.prisma.emailTemplateVersion.findUnique({
      where: { templateId_version: { templateId: id, version } },
    });
    if (!snapshot) throw new NotFoundException("Không tìm thấy phiên bản template.");
    await this.validateSender(snapshot.senderId, snapshot.category);
    const updated = await this.prisma.$transaction(async (transaction) => {
      const next = await transaction.emailTemplate.update({
        where: { id },
        data: {
          name: snapshot.name,
          description: snapshot.description,
          category: snapshot.category,
          status: "active",
          subject: snapshot.subject,
          preheader: snapshot.preheader,
          htmlContent: snapshot.htmlContent,
          textContent: snapshot.textContent,
          variables: snapshot.variables as Prisma.InputJsonValue,
          senderId: snapshot.senderId,
          version: { increment: 1 },
          lastPublishedAt: new Date(),
          updatedById: actorUserId,
        },
        include: templateInclude,
      });
      await this.createVersion(transaction, next, actorUserId);
      await this.audit.record(
        {
          actorUserId,
          action: "email.template.version_restored",
          resourceType: "email_template",
          resourceId: id,
          previousData: this.auditData(current),
          newData: {
            ...this.auditData(next),
            restoredFromVersion: version,
          },
          ...context,
        },
        transaction,
      );
      return next;
    });
    return this.response(updated);
  }

  private async record(id: number) {
    const template = await this.prisma.emailTemplate.findFirst({
      where: { id, deletedAt: null },
      include: templateInclude,
    });
    if (!template) throw new NotFoundException("Không tìm thấy email template.");
    return template;
  }

  private prepare(input: {
    subject: string;
    preheader?: string | null;
    htmlContent: string;
    textContent?: string | null;
    variables: EmailTemplateVariableDto[];
    status: string;
  }) {
    const htmlContent = sanitizeEmailHtml(input.htmlContent);
    if (!htmlContent.trim()) {
      throw new BadRequestException("HTML email không còn nội dung hợp lệ sau sanitize.");
    }
    const textContent = input.textContent?.trim() || htmlToPlainText(htmlContent);
    validateTemplateVariables({ ...input, htmlContent, textContent });
    return { htmlContent, textContent };
  }

  private async validateSender(senderId: number | null | undefined, category: string) {
    if (!senderId) return;
    const sender = await this.prisma.emailSender.findFirst({
      where: { id: senderId, deletedAt: null },
    });
    if (!sender) throw new BadRequestException("Sender đã chọn không tồn tại.");
    if (sender.type !== category) {
      throw new BadRequestException("Sender phải cùng category với template.");
    }
    if (sender.status === "disabled") {
      throw new BadRequestException("Không thể dùng sender đã bị vô hiệu hóa.");
    }
  }

  private createVersion(
    transaction: Prisma.TransactionClient,
    template: TemplateRecord,
    actorUserId: number,
  ) {
    return transaction.emailTemplateVersion.create({
      data: {
        templateId: template.id,
        version: template.version,
        name: template.name,
        description: template.description,
        category: template.category,
        subject: template.subject,
        preheader: template.preheader,
        htmlContent: template.htmlContent,
        textContent: template.textContent,
        variables: template.variables as Prisma.InputJsonValue,
        senderId: template.senderId,
        publishedById: actorUserId,
      },
    });
  }

  private variables(value: Prisma.JsonValue) {
    return (Array.isArray(value) ? value : []) as unknown as EmailTemplateVariableDto[];
  }

  private response(template: TemplateRecord) {
    return { ...template, variables: this.variables(template.variables) };
  }

  private auditData(template: {
    id: number;
    code: string;
    name: string;
    category: string;
    status: string;
    senderId: number | null;
    version: number;
  }): Prisma.InputJsonObject {
    return {
      id: template.id,
      code: template.code,
      name: template.name,
      category: template.category,
      status: template.status,
      senderId: template.senderId,
      version: template.version,
    };
  }
}
