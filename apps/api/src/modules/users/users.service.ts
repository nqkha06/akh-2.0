import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";

import { resolveUserAuthorization } from "../authorization/user-authorization";
import { PrismaService } from "../../database/prisma/prisma.service";
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
  roles: {
    select: {
      role: {
        select: {
          id: true,
          key: true,
          name: true,
          permissions: {
            select: { permission: { select: { key: true } } },
          },
        },
      },
    },
  },
  permissions: {
    select: {
      permission: { select: { id: true, key: true, name: true } },
    },
  },
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
      ...(query.role?.length
        ? {
            roles: {
              some: { role: { key: { in: query.role } } },
            },
          }
        : {}),
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
    if (filter.id === "role") return this.buildRoleFilter(filter);

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

  private buildRoleFilter(
    filter: UserFilterDto,
  ): Prisma.UserWhereInput | undefined {
    const value = typeof filter.value === "string" ? filter.value : undefined;
    const values = Array.isArray(filter.value) ? filter.value : undefined;

    switch (filter.operator) {
      case "eq":
        return value
          ? { roles: { some: { role: { key: value } } } }
          : undefined;
      case "ne":
        return value
          ? { NOT: { roles: { some: { role: { key: value } } } } }
          : undefined;
      case "inArray":
        return values?.length
          ? { roles: { some: { role: { key: { in: values } } } } }
          : undefined;
      case "notInArray":
        return values?.length
          ? { NOT: { roles: { some: { role: { key: { in: values } } } } } }
          : undefined;
      case "isEmpty":
        return { roles: { none: {} } };
      case "isNotEmpty":
        return { roles: { some: {} } };
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

  async getAccessOptions() {
    const [roles, permissions] = await Promise.all([
      this.prisma.role.findMany({
        select: { id: true, key: true, name: true, isSystem: true },
        orderBy: [{ isSystem: "desc" }, { name: "asc" }],
      }),
      this.prisma.permission.findMany({
        select: { id: true, key: true, name: true, description: true, group: true },
        orderBy: [{ group: "asc" }, { key: "asc" }],
      }),
    ]);
    return { roles, permissions };
  }

  async create(dto: CreateUserDto) {
    const assignments = await this.resolveAssignments(
      dto.roles,
      dto.permissions,
    );
    try {
      const user = await this.prisma.user.create({
        data: {
          name: dto.name.trim(),
          email: dto.email.trim().toLowerCase(),
          passwordHash: await hash(dto.password, 12),
          status: dto.status,
          roles: {
            create: assignments.roleIds.map((roleId) => ({ roleId })),
          },
          permissions: {
            create: assignments.permissionIds.map((permissionId) => ({
              permissionId,
            })),
          },
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
    const existing = await this.prisma.user.findUnique({
      where: { id },
      select: {
        status: true,
        roles: { select: { role: { select: { key: true } } } },
        permissions: {
          select: { permission: { select: { key: true } } },
        },
      },
    });
    if (!existing) throw new NotFoundException("Không tìm thấy người dùng.");

    if (
      currentAdminId === id &&
      (dto.roles ||
        dto.permissions ||
        (dto.status && dto.status !== "active"))
    ) {
      throw new BadRequestException(
        "Bạn không thể tự thay đổi quyền hoặc vô hiệu hóa tài khoản đang đăng nhập.",
      );
    }

    const existingRoleKeys = existing.roles.map(
      (assignment) => assignment.role.key,
    );
    if (
      existingRoleKeys.includes("admin") &&
      dto.roles &&
      !dto.roles.includes("admin")
    ) {
      await this.assertAnotherActiveAdminExists(id);
    }

    const assignments =
      dto.roles || dto.permissions
        ? await this.resolveAssignments(
            dto.roles || existingRoleKeys,
            dto.permissions ||
              existing.permissions.map(
                (assignment) => assignment.permission.key,
              ),
          )
        : null;
    const passwordHash = dto.password ? await hash(dto.password, 12) : undefined;
    const securityChanged = Boolean(
      passwordHash ||
        dto.roles ||
        dto.permissions ||
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
            ...(dto.status ? { status: dto.status } : {}),
            ...(securityChanged ? { tokenVersion: { increment: 1 } } : {}),
          },
        });

        if (assignments && dto.roles) {
          await prisma.userHasRole.deleteMany({ where: { userId: id } });
          await prisma.userHasRole.createMany({
            data: assignments.roleIds.map((roleId) => ({ userId: id, roleId })),
          });
        }
        if (assignments && dto.permissions) {
          await prisma.userHasPermission.deleteMany({ where: { userId: id } });
          if (assignments.permissionIds.length) {
            await prisma.userHasPermission.createMany({
              data: assignments.permissionIds.map((permissionId) => ({
                userId: id,
                permissionId,
              })),
            });
          }
        }

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
        roles: { select: { role: { select: { key: true } } } },
        _count: { select: { links: true } },
      },
    });
    if (!existing) throw new NotFoundException("Không tìm thấy người dùng.");
    if (existing._count.links > 0) {
      throw new ConflictException(
        "Không thể xóa người dùng đang sở hữu nội dung. Hãy vô hiệu hóa tài khoản thay vì xóa.",
      );
    }
    if (existing.roles.some((assignment) => assignment.role.key === "admin")) {
      await this.assertAnotherActiveAdminExists(id);
    }

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
        roles: { some: { role: { key: "admin" } } },
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
    roles: Array<{
      role: {
        id: number;
        key: string;
        name: string;
        permissions: Array<{ permission: { key: string } }>;
      };
    }>;
    permissions: Array<{
      permission: { id: number; key: string; name: string };
    }>;
    createdAt: Date;
    updatedAt: Date;
    _count?: { links: number; authSessions: number };
  }) {
    const authorization = resolveUserAuthorization(user);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt,
      emailVerified: Boolean(user.emailVerifiedAt),
      avatar: user.avatar,
      status: user.status,
      role: authorization.role,
      roles: user.roles.map((assignment) => ({
        id: assignment.role.id,
        key: assignment.role.key,
        name: assignment.role.name,
      })),
      directPermissions: user.permissions.map(
        (assignment) => assignment.permission.key,
      ),
      permissions: authorization.permissions,
      linksCount: user._count?.links || 0,
      activeSessionsCount: user._count?.authSessions || 0,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private async resolveAssignments(
    roleKeys: string[],
    permissionKeys: string[],
  ) {
    const uniqueRoleKeys = [...new Set(roleKeys)];
    const uniquePermissionKeys = [...new Set(permissionKeys)];
    const [roles, permissions] = await Promise.all([
      this.prisma.role.findMany({
        where: { key: { in: uniqueRoleKeys } },
        select: { id: true, key: true },
      }),
      this.prisma.permission.findMany({
        where: { key: { in: uniquePermissionKeys } },
        select: { id: true, key: true },
      }),
    ]);
    const foundRoles = new Set(roles.map((role) => role.key));
    const foundPermissions = new Set(
      permissions.map((permission) => permission.key),
    );
    const missingRoles = uniqueRoleKeys.filter((key) => !foundRoles.has(key));
    const missingPermissions = uniquePermissionKeys.filter(
      (key) => !foundPermissions.has(key),
    );
    if (missingRoles.length) {
      throw new NotFoundException(
        `Role không tồn tại: ${missingRoles.join(", ")}.`,
      );
    }
    if (missingPermissions.length) {
      throw new NotFoundException(
        `Permission không tồn tại: ${missingPermissions.join(", ")}.`,
      );
    }
    return {
      roleIds: roles.map((role) => role.id),
      permissionIds: permissions.map((permission) => permission.id),
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
