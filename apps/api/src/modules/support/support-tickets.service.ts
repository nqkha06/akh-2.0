import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { basename } from "node:path";

import { PrismaService } from "../../database/prisma/prisma.service";
import type {
  CreateSupportTicketDto,
  ListSupportTicketsQueryDto,
  UpdateSupportTicketDto,
} from "./dto/support-ticket.dto";
import { SupportTicketStorageService } from "./support-ticket-storage.service";

const userSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
} satisfies Prisma.UserSelect;

const ticketDetailInclude = {
  user: { select: userSelect },
  assignedTo: { select: userSelect },
  attachments: { orderBy: { createdAt: "asc" as const } },
  messages: {
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" as const },
    include: {
      author: { select: userSelect },
      attachments: { orderBy: { createdAt: "asc" as const } },
    },
  },
} satisfies Prisma.SupportTicketInclude;

type TicketDetail = Prisma.SupportTicketGetPayload<{
  include: typeof ticketDetailInclude;
}>;

@Injectable()
export class SupportTicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: SupportTicketStorageService,
  ) {}

  async listForMember(userId: number) {
    const tickets = await this.prisma.supportTicket.findMany({
      where: { userId, deletedAt: null },
      orderBy: { lastMessageAt: "desc" },
      take: 100,
      include: ticketDetailInclude,
    });
    return tickets.map((ticket) => this.toDetail(ticket, false));
  }

  async findForMember(userId: number, id: number) {
    const ticket = await this.findDetail({ id, userId, deletedAt: null });
    return this.toDetail(ticket, false);
  }

  async createForMember(
    userId: number,
    dto: CreateSupportTicketDto,
    files: Express.Multer.File[],
  ) {
    if (files.length > 5) {
      throw new BadRequestException("Mỗi ticket chỉ được đính kèm tối đa 5 tệp.");
    }

    const prepared = await Promise.all(
      files.map(async (file) => {
        const validated = await this.storage.validate(file);
        return {
          file,
          fileName: this.safeFileName(file.originalname),
          mimeType: validated.mimeType,
          storageKey: this.storage.buildStorageKey(userId, validated.extension),
        };
      }),
    );

    const written: string[] = [];
    try {
      for (const item of prepared) {
        await this.storage.write(item.storageKey, item.file.buffer);
        written.push(item.storageKey);
      }

      const ticketId = await this.prisma.$transaction(async (tx) => {
        const ticket = await tx.supportTicket.create({
          data: {
            reference: `pending-${randomUUID()}`,
            userId,
            subject: dto.subject.trim(),
            category: dto.category,
            relatedResource: dto.relatedResource?.trim() || null,
            technicalInfo: dto.technicalInfo?.trim() || null,
          },
          select: { id: true },
        });
        const reference = `TKT-${new Date().getUTCFullYear()}-${String(ticket.id).padStart(6, "0")}`;
        await tx.supportTicket.update({
          where: { id: ticket.id },
          data: { reference },
        });
        const message = await tx.supportTicketMessage.create({
          data: {
            ticketId: ticket.id,
            authorId: userId,
            authorRole: "member",
            content: dto.content.trim(),
          },
          select: { id: true },
        });
        if (prepared.length) {
          await tx.supportTicketAttachment.createMany({
            data: prepared.map((item) => ({
              ticketId: ticket.id,
              messageId: message.id,
              uploadedById: userId,
              fileName: item.fileName,
              mimeType: item.mimeType,
              size: item.file.size,
              storageKey: item.storageKey,
            })),
          });
        }
        return ticket.id;
      });

      return this.findForMember(userId, ticketId);
    } catch (error) {
      await Promise.all(written.map((key) => this.storage.remove(key)));
      throw error;
    }
  }

  async replyForMember(userId: number, id: number, content: string) {
    const existing = await this.prisma.supportTicket.findFirst({
      where: { id, userId, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!existing) throw new NotFoundException("Không tìm thấy ticket.");
    if (existing.status === "closed") {
      throw new ConflictException("Ticket đã đóng và không thể phản hồi.");
    }

    await this.prisma.$transaction([
      this.prisma.supportTicketMessage.create({
        data: {
          ticketId: id,
          authorId: userId,
          authorRole: "member",
          content: content.trim(),
        },
      }),
      this.prisma.supportTicket.update({
        where: { id },
        data: {
          status: "in_progress",
          lastMessageAt: new Date(),
          resolvedAt: null,
          closedAt: null,
        },
      }),
    ]);
    return this.findForMember(userId, id);
  }

  async listForAdmin(query: ListSupportTicketsQueryDto, adminId: number) {
    const where: Prisma.SupportTicketWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.assignment === "mine"
        ? { assignedToId: adminId }
        : query.assignment === "unassigned"
          ? { assignedToId: null }
          : {}),
      ...(query.search
        ? {
            OR: [
              { reference: { contains: query.search } },
              { subject: { contains: query.search } },
              { user: { name: { contains: query.search } } },
              { user: { email: { contains: query.search } } },
            ],
          }
        : {}),
    };
    const skip = (query.page - 1) * query.perPage;
    const orderBy = {
      [query.sortBy]: query.sortOrder,
    } as Prisma.SupportTicketOrderByWithRelationInput;

    const [items, total, open, waiting, urgent, unassigned] =
      await this.prisma.$transaction([
        this.prisma.supportTicket.findMany({
          where,
          skip,
          take: query.perPage,
          orderBy,
          include: {
            user: { select: userSelect },
            assignedTo: { select: userSelect },
            _count: { select: { messages: true, attachments: true } },
          },
        }),
        this.prisma.supportTicket.count({ where }),
        this.prisma.supportTicket.count({
          where: {
            deletedAt: null,
            status: { in: ["submitted", "in_progress", "waiting_user", "answered"] },
          },
        }),
        this.prisma.supportTicket.count({
          where: { deletedAt: null, status: "waiting_user" },
        }),
        this.prisma.supportTicket.count({
          where: {
            deletedAt: null,
            priority: "urgent",
            status: { notIn: ["resolved", "closed"] },
          },
        }),
        this.prisma.supportTicket.count({
          where: {
            deletedAt: null,
            assignedToId: null,
            status: { notIn: ["resolved", "closed"] },
          },
        }),
      ]);

    return {
      items: items.map((ticket) => ({
        id: ticket.id,
        reference: ticket.reference,
        subject: ticket.subject,
        category: ticket.category,
        status: ticket.status,
        priority: ticket.priority,
        relatedResource: ticket.relatedResource,
        user: ticket.user,
        assignedTo: ticket.assignedTo,
        messageCount: ticket._count.messages,
        attachmentCount: ticket._count.attachments,
        lastMessageAt: ticket.lastMessageAt.toISOString(),
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
      })),
      pagination: {
        page: query.page,
        perPage: query.perPage,
        total,
        pageCount: Math.max(1, Math.ceil(total / query.perPage)),
      },
      summary: { open, waiting, urgent, unassigned },
    };
  }

  async findForAdmin(id: number) {
    const ticket = await this.findDetail({ id, deletedAt: null });
    return this.toDetail(ticket, true);
  }

  async replyForAdmin(adminId: number, id: number, content: string) {
    const existing = await this.prisma.supportTicket.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, status: true, assignedToId: true },
    });
    if (!existing) throw new NotFoundException("Không tìm thấy ticket.");
    if (existing.status === "closed") {
      throw new ConflictException("Hãy mở lại ticket trước khi phản hồi.");
    }

    await this.prisma.$transaction([
      this.prisma.supportTicketMessage.create({
        data: {
          ticketId: id,
          authorId: adminId,
          authorRole: "support",
          content: content.trim(),
        },
      }),
      this.prisma.supportTicket.update({
        where: { id },
        data: {
          status: "waiting_user",
          assignedToId: existing.assignedToId ?? adminId,
          lastMessageAt: new Date(),
          resolvedAt: null,
          closedAt: null,
        },
      }),
    ]);
    return this.findForAdmin(id);
  }

  async updateForAdmin(
    adminId: number,
    id: number,
    dto: UpdateSupportTicketDto,
  ) {
    if (dto.assignToMe && dto.unassign) {
      throw new BadRequestException(
        "Không thể vừa nhận xử lý vừa bỏ gán ticket.",
      );
    }
    const existing = await this.prisma.supportTicket.findFirst({
      where: { id, deletedAt: null },
      select: {
        status: true,
        priority: true,
        assignedToId: true,
      },
    });
    if (!existing) throw new NotFoundException("Không tìm thấy ticket.");

    const nextAssignedToId = dto.assignToMe
      ? adminId
      : dto.unassign
        ? null
        : existing.assignedToId;
    const nextStatus =
      dto.status ||
      (dto.assignToMe && existing.status === "submitted"
        ? "in_progress"
        : existing.status);
    const changes: string[] = [];
    if (nextStatus !== existing.status) {
      changes.push(`Trạng thái: ${existing.status} → ${nextStatus}`);
    }
    if (dto.priority && dto.priority !== existing.priority) {
      changes.push(`Ưu tiên: ${existing.priority} → ${dto.priority}`);
    }
    if (nextAssignedToId !== existing.assignedToId) {
      changes.push(nextAssignedToId ? "Đã nhận xử lý ticket" : "Đã bỏ gán ticket");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.supportTicket.update({
        where: { id },
        data: {
          ...(nextStatus !== existing.status ? { status: nextStatus } : {}),
          ...(dto.priority ? { priority: dto.priority } : {}),
          assignedToId: nextAssignedToId,
          ...(nextStatus === "resolved" && nextStatus !== existing.status
            ? { resolvedAt: new Date(), closedAt: null }
            : nextStatus === "closed" && nextStatus !== existing.status
              ? { closedAt: new Date() }
              : nextStatus !== existing.status
                ? { resolvedAt: null, closedAt: null }
                : {}),
        },
      });
      if (changes.length) {
        await tx.supportTicketMessage.create({
          data: {
            ticketId: id,
            authorId: adminId,
            authorRole: "system",
            isInternal: true,
            content: changes.join(" · "),
          },
        });
      }
    });
    return this.findForAdmin(id);
  }

  async attachmentForMember(
    userId: number,
    ticketId: number,
    attachmentId: string,
  ) {
    return this.findAttachment({
      id: attachmentId,
      ticketId,
      ticket: { userId, deletedAt: null },
    });
  }

  async attachmentForAdmin(ticketId: number, attachmentId: string) {
    return this.findAttachment({
      id: attachmentId,
      ticketId,
      ticket: { deletedAt: null },
    });
  }

  private async findAttachment(
    where: Prisma.SupportTicketAttachmentWhereInput,
  ) {
    const attachment = await this.prisma.supportTicketAttachment.findFirst({
      where,
    });
    if (!attachment) {
      throw new NotFoundException("Không tìm thấy tệp đính kèm.");
    }
    return {
      attachment,
      buffer: await this.storage.read(attachment.storageKey),
    };
  }

  private async findDetail(where: Prisma.SupportTicketWhereInput) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where,
      include: ticketDetailInclude,
    });
    if (!ticket) throw new NotFoundException("Không tìm thấy ticket.");
    return ticket;
  }

  private toDetail(ticket: TicketDetail, admin: boolean) {
    const messages = ticket.messages.filter(
      (message) => admin || !message.isInternal,
    );
    const firstMemberMessage = messages.find(
      (message) => message.authorRole === "member",
    );
    return {
      id: ticket.id,
      reference: ticket.reference,
      subject: ticket.subject,
      category: this.categoryLabel(ticket.category),
      categoryValue: ticket.category,
      status: ticket.status,
      priority: ticket.priority,
      relatedResource: ticket.relatedResource,
      technicalInfo: admin ? ticket.technicalInfo : undefined,
      user: ticket.user,
      assignedTo: ticket.assignedTo,
      content: firstMemberMessage?.content ?? "",
      attachments: ticket.attachments.map((attachment) =>
        this.toAttachment(ticket.id, attachment, admin),
      ),
      messages: messages.map((message) => ({
        id: message.id,
        sender:
          message.author?.name ||
          (message.authorRole === "support" ? "Đội ngũ hỗ trợ" : "Hệ thống"),
        senderRole:
          message.authorRole === "member"
            ? "user"
            : message.authorRole === "system"
              ? "system"
              : "support",
        content: message.content,
        isInternal: message.isInternal,
        createdAt: message.createdAt.toISOString(),
        attachments: message.attachments.map((attachment) =>
          this.toAttachment(ticket.id, attachment, admin),
        ),
      })),
      lastMessageAt: ticket.lastMessageAt.toISOString(),
      resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
      closedAt: ticket.closedAt?.toISOString() ?? null,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
    };
  }

  private toAttachment(
    ticketId: number,
    attachment: TicketDetail["attachments"][number],
    admin: boolean,
  ) {
    return {
      id: attachment.id,
      name: attachment.fileName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      downloadPath: admin
        ? `/admin/support/tickets/${ticketId}/attachments/${attachment.id}`
        : `/member/support/tickets/${ticketId}/attachments/${attachment.id}`,
    };
  }

  private safeFileName(value: string) {
    return basename(value)
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .slice(0, 180);
  }

  private categoryLabel(value: string) {
    const labels: Record<string, string> = {
      usage: "Câu hỏi sử dụng",
      technical: "Lỗi kỹ thuật",
      social_links: "Social links",
      files: "Files",
      link_in_bio: "Link-in-bio",
      monetization: "Kiếm tiền",
      withdrawal: "Rút tiền",
      rewards: "Phần thưởng",
      account: "Tài khoản và bảo mật",
      abuse: "Báo cáo lạm dụng",
      other: "Khác",
    };
    return labels[value] || value;
  }
}
