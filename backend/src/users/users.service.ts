import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";

import { PrismaService } from "../prisma/prisma.service";
import type { CreateUserDto } from "./dto/create-user.dto";
import type {
  ListUsersQueryDto,
  UserFilterDto,
} from "./dto/list-users-query.dto";
import type { UpdateUserDto } from "./dto/update-user.dto";

const userSelect = {
  id: true,
  name: true,
  email: true,
  emailVerifiedAt: true,
  avatar: true,
  status: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListUsersQueryDto) {
    const search = (query.name || query.search)?.trim();
    const email = query.email?.trim();
    const perPage = query.perPage ?? query.limit;
    const appliedSort = query.sort?.length
      ? query.sort
      : [{ id: query.sortBy, desc: query.sortOrder === "desc" }];
    const orderBy = appliedSort.map(
      (sort) =>
        ({ [sort.id]: sort.desc ? "desc" : "asc" }) satisfies Prisma.UserOrderByWithRelationInput,
    );
    const standardWhere: Prisma.UserWhereInput = {
      ...(query.role?.length ? { role: { in: query.role } } : {}),
      ...(query.status?.length ? { status: { in: query.status } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : {}),
      ...(email ? { email: { contains: email } } : {}),
    };
    const advancedWhere = this.buildAdvancedWhere(
      query.filters || [],
      query.joinOperator,
    );
    const where: Prisma.UserWhereInput = advancedWhere
      ? { AND: [standardWhere, advancedWhere] }
      : standardWhere;
    const skip = (query.page - 1) * perPage;
    const activeSessionWhere = {
      revokedAt: null,
      expiresAt: { gt: new Date() },
    } satisfies Prisma.AuthSessionWhereInput;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: perPage,
        orderBy,
        select: {
          ...userSelect,
          _count: {
            select: {
              links: true,
              authSessions: { where: activeSessionWhere },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const data = items.map((user) => this.toResponse(user));
    const pageCount = Math.max(1, Math.ceil(total / perPage));

    return {
      data,
      items: data,
      page: query.page,
      perPage,
      limit: perPage,
      total,
      pageCount,
      totalPages: pageCount,
      sort: appliedSort,
      filters: {
        search: search || null,
        email: email || null,
        role: query.role || [],
        status: query.status || [],
        advanced: query.filters || [],
        joinOperator: query.joinOperator,
      },
    };
  }

  private buildAdvancedWhere(
    filters: UserFilterDto[],
    joinOperator: "and" | "or",
  ): Prisma.UserWhereInput | undefined {
    const conditions = filters
      .map((filter) => this.buildFilterCondition(filter))
      .filter((condition): condition is Prisma.UserWhereInput => Boolean(condition));

    if (conditions.length === 0) return undefined;
    return joinOperator === "or" ? { OR: conditions } : { AND: conditions };
  }

  private buildFilterCondition(
    filter: UserFilterDto,
  ): Prisma.UserWhereInput | undefined {
    if (filter.id === "createdAt") return this.buildDateFilter(filter);

    const value = typeof filter.value === "string" ? filter.value : undefined;
    const values = Array.isArray(filter.value) ? filter.value : undefined;
    const field = filter.id;

    switch (filter.operator) {
      case "iLike":
        return filter.variant === "text" && value
          ? ({ [field]: { contains: value } } as Prisma.UserWhereInput)
          : undefined;
      case "notILike":
        return filter.variant === "text" && value
          ? ({ NOT: { [field]: { contains: value } } } as Prisma.UserWhereInput)
          : undefined;
      case "eq":
        return value !== undefined
          ? ({ [field]: { equals: value } } as Prisma.UserWhereInput)
          : undefined;
      case "ne":
        return value !== undefined
          ? ({ NOT: { [field]: { equals: value } } } as Prisma.UserWhereInput)
          : undefined;
      case "inArray":
        return values?.length
          ? ({ [field]: { in: values } } as Prisma.UserWhereInput)
          : undefined;
      case "notInArray":
        return values?.length
          ? ({ [field]: { notIn: values } } as Prisma.UserWhereInput)
          : undefined;
      case "isEmpty":
        return { [field]: { equals: "" } } as Prisma.UserWhereInput;
      case "isNotEmpty":
        return { [field]: { not: "" } } as Prisma.UserWhereInput;
      default:
        return undefined;
    }
  }

  private buildDateFilter(filter: UserFilterDto): Prisma.UserWhereInput | undefined {
    const value = typeof filter.value === "string" ? filter.value : undefined;
    const values = Array.isArray(filter.value) ? filter.value : undefined;
    const date = value ? this.parseDateValue(value) : null;

    switch (filter.operator) {
      case "eq":
        return date
          ? { createdAt: { gte: this.startOfDay(date), lte: this.endOfDay(date) } }
          : undefined;
      case "ne":
        return date
          ? {
              OR: [
                { createdAt: { lt: this.startOfDay(date) } },
                { createdAt: { gt: this.endOfDay(date) } },
              ],
            }
          : undefined;
      case "lt":
        return date ? { createdAt: { lt: this.endOfDay(date) } } : undefined;
      case "lte":
        return date ? { createdAt: { lte: this.endOfDay(date) } } : undefined;
      case "gt":
        return date ? { createdAt: { gt: this.startOfDay(date) } } : undefined;
      case "gte":
        return date ? { createdAt: { gte: this.startOfDay(date) } } : undefined;
      case "isBetween": {
        if (!values || values.length !== 2) return undefined;
        const start = values[0] ? this.parseDateValue(values[0]) : null;
        const end = values[1] ? this.parseDateValue(values[1]) : null;
        if (!start && !end) return undefined;
        return {
          createdAt: {
            ...(start ? { gte: this.startOfDay(start) } : {}),
            ...(end ? { lte: this.endOfDay(end) } : {}),
          },
        };
      }
      case "isRelativeToToday": {
        if (!value) return undefined;
        const [amountValue, unit] = value.split(" ");
        const amount = Number.parseInt(amountValue || "", 10);
        if (!Number.isFinite(amount)) return undefined;
        const days = unit === "weeks" ? amount * 7 : unit === "months" ? amount * 30 : unit === "days" ? amount : null;
        if (days === null) return undefined;
        const start = new Date();
        start.setDate(start.getDate() + days);
        const span = unit === "weeks" ? 6 : unit === "months" ? 29 : 0;
        const end = new Date(start);
        end.setDate(end.getDate() + span);
        return { createdAt: { gte: this.startOfDay(start), lte: this.endOfDay(end) } };
      }
      default:
        return undefined;
    }
  }

  private parseDateValue(value: string) {
    const numeric = Number(value);
    const date = new Date(Number.isFinite(numeric) ? numeric : value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private startOfDay(value: Date) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private endOfDay(value: Date) {
    const date = new Date(value);
    date.setHours(23, 59, 59, 999);
    return date;
  }

  async findOne(id: number) {
    return this.toResponse(await this.findUserRecord(id));
  }

  async create(dto: CreateUserDto) {
    try {
      const user = await this.prisma.user.create({
        data: {
          name: dto.name.trim(),
          email: dto.email.trim().toLowerCase(),
          passwordHash: await hash(dto.password, 12),
          role: dto.role,
          status: dto.status,
        },
        select: userSelect,
      });
      return this.toResponse({ ...user, _count: { links: 0, authSessions: 0 } });
    } catch (error) {
      this.rethrowKnownError(error);
      throw error;
    }
  }

  async update(currentAdminId: number, id: number, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Không tìm thấy người dùng.");

    if (
      currentAdminId === id &&
      ((dto.role && dto.role !== "admin") ||
        (dto.status && dto.status !== "active"))
    ) {
      throw new BadRequestException(
        "Bạn không thể tự hạ quyền hoặc vô hiệu hóa tài khoản đang đăng nhập.",
      );
    }

    if (existing.role === "admin" && dto.role === "member") {
      await this.assertAnotherActiveAdminExists(id);
    }

    const passwordHash = dto.password ? await hash(dto.password, 12) : undefined;
    const securityChanged = Boolean(
      passwordHash ||
        (dto.role && dto.role !== existing.role) ||
        (dto.status && dto.status !== existing.status),
    );

    try {
      await this.prisma.$transaction(async (prisma) => {
        await prisma.user.update({
          where: { id },
          data: {
            ...(dto.name ? { name: dto.name.trim() } : {}),
            ...(dto.email ? { email: dto.email.trim().toLowerCase() } : {}),
            ...(passwordHash ? { passwordHash } : {}),
            ...(dto.role ? { role: dto.role } : {}),
            ...(dto.status ? { status: dto.status } : {}),
            ...(securityChanged ? { tokenVersion: { increment: 1 } } : {}),
          },
        });

        if (securityChanged) {
          await prisma.authSession.updateMany({
            where: { userId: id, revokedAt: null },
            data: { revokedAt: new Date() },
          });
        }
      });
    } catch (error) {
      this.rethrowKnownError(error);
      throw error;
    }

    return this.findOne(id);
  }

  async remove(currentAdminId: number, id: number) {
    if (currentAdminId === id) {
      throw new BadRequestException("Bạn không thể xóa tài khoản đang đăng nhập.");
    }

    const existing = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        _count: { select: { links: true } },
      },
    });
    if (!existing) throw new NotFoundException("Không tìm thấy người dùng.");
    if (existing._count.links > 0) {
      throw new ConflictException(
        "Không thể xóa người dùng đang sở hữu nội dung. Hãy vô hiệu hóa tài khoản thay vì xóa.",
      );
    }
    if (existing.role === "admin") await this.assertAnotherActiveAdminExists(id);

    await this.prisma.user.delete({ where: { id } });
    return { id, deleted: true as const };
  }

  private async findUserRecord(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...userSelect,
        _count: {
          select: {
            links: true,
            authSessions: {
              where: { revokedAt: null, expiresAt: { gt: new Date() } },
            },
          },
        },
      },
    });
    if (!user) throw new NotFoundException("Không tìm thấy người dùng.");
    return user;
  }

  private async assertAnotherActiveAdminExists(excludedUserId: number) {
    const count = await this.prisma.user.count({
      where: {
        id: { not: excludedUserId },
        role: "admin",
        status: "active",
      },
    });
    if (count === 0) {
      throw new ConflictException("Hệ thống phải luôn còn ít nhất một admin hoạt động.");
    }
  }

  private toResponse(user: {
    id: number;
    name: string;
    email: string;
    emailVerifiedAt: Date | null;
    avatar: string | null;
    status: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
    _count?: { links: number; authSessions: number };
  }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt,
      emailVerified: Boolean(user.emailVerifiedAt),
      avatar: user.avatar,
      status: user.status,
      role: user.role,
      linksCount: user._count?.links || 0,
      activeSessionsCount: user._count?.authSessions || 0,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private rethrowKnownError(error: unknown): never | void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictException("Email đã được sử dụng.");
    }
  }
}
