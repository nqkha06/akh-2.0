import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";

import { PrismaService } from "../../database/prisma/prisma.service";
import type { AuthenticatedUser } from "../auth/auth.types";
import { resolveUserAuthorization } from "../authorization/user-authorization";
import type { CreateUserDto } from "./dto/create-user.dto";
import type {
  ListUsersQueryDto,
  UserFilterDto,
} from "./dto/list-users-query.dto";
import type { UpdateUserDto } from "./dto/update-user.dto";
import type { UpdateUserAccessDto } from "./dto/user-actions.dto";
import type { UserStatus } from "./users.constants";

const userSelect = {
  id: true,
  name: true,
  email: true,
  emailVerifiedAt: true,
  avatar: true,
  balance: true,
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

type UserRecord = Prisma.UserGetPayload<{ select: typeof userSelect }> & {
  _count?: { links: number; authSessions: number };
};

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
        ({
          [sort.id]: sort.desc ? "desc" : "asc",
        }) satisfies Prisma.UserOrderByWithRelationInput,
    );
    const standardWhere: Prisma.UserWhereInput = {
      ...(query.role?.length
        ? { roles: { some: { role: { key: { in: query.role } } } } }
        : {}),
      ...(query.status?.length ? { status: { in: query.status } } : {}),
      ...(query.emailVerified === "verified"
        ? { emailVerifiedAt: { not: null } }
        : query.emailVerified === "unverified"
          ? { emailVerifiedAt: null }
          : {}),
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
    const where = advancedWhere
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
        emailVerified: query.emailVerified || null,
        advanced: query.filters || [],
        joinOperator: query.joinOperator,
      },
    };
  }

  async findOne(id: number) {
    return this.toResponse(await this.findUserRecord(id));
  }

  async getAccessOptions() {
    const [roles, permissions] = await Promise.all([
      this.prisma.role.findMany({
        select: {
          id: true,
          key: true,
          name: true,
          isSystem: true,
          permissions: {
            select: { permission: { select: { key: true } } },
          },
        },
        orderBy: [{ isSystem: "desc" }, { name: "asc" }],
      }),
      this.prisma.permission.findMany({
        select: {
          id: true,
          key: true,
          name: true,
          description: true,
          group: true,
        },
        orderBy: [{ group: "asc" }, { key: "asc" }],
      }),
    ]);
    return {
      roles: roles.map((role) => ({
        id: role.id,
        key: role.key,
        name: role.name,
        isSystem: role.isSystem,
        permissionKeys: role.permissions.map(
          ({ permission }) => permission.key,
        ),
      })),
      permissions,
    };
  }

  async create(currentAdmin: AuthenticatedUser, dto: CreateUserDto) {
    if (dto.status !== "active") {
      this.assertPermission(currentAdmin, "users.manage-status");
    }
    if (
      dto.roles.some((role) => role !== "member") ||
      dto.permissions.length > 0
    ) {
      this.assertPermission(currentAdmin, "users.manage-roles");
    }
    if (dto.emailVerified) {
      this.assertPermission(currentAdmin, "users.verify-email");
    }

    const assignments = await this.resolveAssignments(
      currentAdmin,
      dto.roles,
      dto.permissions,
    );
    try {
      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          avatar: dto.avatar || null,
          emailVerifiedAt: dto.emailVerified ? new Date() : null,
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
      return this.toResponse({
        ...user,
        _count: { links: 0, authSessions: 0 },
      });
    } catch (error) {
      this.rethrowPersistenceError(error);
      throw error;
    }
  }

  async update(
    currentAdmin: AuthenticatedUser,
    id: number,
    dto: UpdateUserDto,
  ) {
    const existing = await this.findSecurityRecord(id);
    this.assertCanManageTarget(currentAdmin, existing);
    if (dto.status && dto.status !== existing.status) {
      this.assertPermission(currentAdmin, "users.manage-status");
    }
    if (dto.roles || dto.permissions) {
      this.assertPermission(currentAdmin, "users.manage-roles");
    }
    this.assertNotMutatingOwnAccess(currentAdmin.id, id, dto);

    const existingRoleKeys = existing.roles.map(({ role }) => role.key);
    const existingPermissionKeys = existing.permissions.map(
      ({ permission }) => permission.key,
    );
    if (
      existingRoleKeys.includes("admin") &&
      ((dto.roles && !dto.roles.includes("admin")) ||
        (dto.status && dto.status !== "active"))
    ) {
      await this.assertActiveAdminWillRemain([id]);
    }

    const assignments =
      dto.roles || dto.permissions
        ? await this.resolveAssignments(
            currentAdmin,
            dto.roles || existingRoleKeys,
            dto.permissions || existingPermissionKeys,
          )
        : null;
    const emailChanged =
      dto.email !== undefined && dto.email !== existing.email;
    const securityChanged = Boolean(
      dto.roles ||
        dto.permissions ||
        (dto.status && dto.status !== existing.status) ||
        emailChanged,
    );

    try {
      await this.prisma.$transaction(async (prisma) => {
        await prisma.user.update({
          where: { id },
          data: {
            ...(dto.name !== undefined ? { name: dto.name } : {}),
            ...(dto.email !== undefined
              ? {
                  email: dto.email,
                  ...(emailChanged ? { emailVerifiedAt: null } : {}),
                }
              : {}),
            ...(dto.avatar !== undefined
              ? { avatar: dto.avatar || null }
              : {}),
            ...(dto.status !== undefined ? { status: dto.status } : {}),
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
      this.rethrowPersistenceError(error);
      throw error;
    }

    return this.findOne(id);
  }

  async updateStatus(
    currentAdmin: AuthenticatedUser,
    id: number,
    status: UserStatus,
  ) {
    const existing = await this.findSecurityRecord(id);
    this.assertCanManageTarget(currentAdmin, existing);
    if (currentAdmin.id === id && status !== "active") {
      throw new BadRequestException(
        "Bạn không thể vô hiệu hóa tài khoản đang đăng nhập.",
      );
    }
    if (
      status !== "active" &&
      existing.roles.some(({ role }) => role.key === "admin")
    ) {
      await this.assertActiveAdminWillRemain([id]);
    }
    if (existing.status === status) return this.findOne(id);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { status, tokenVersion: { increment: 1 } },
      }),
      this.prisma.authSession.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    return this.findOne(id);
  }

  async updateManyStatuses(
    currentAdmin: AuthenticatedUser,
    inputIds: number[],
    status: UserStatus,
  ) {
    const ids = this.uniqueIds(inputIds);
    if (status !== "active" && ids.includes(currentAdmin.id)) {
      throw new BadRequestException(
        "Bạn không thể vô hiệu hóa tài khoản đang đăng nhập.",
      );
    }
    const records = await this.findSecurityRecords(ids);
    for (const record of records) {
      this.assertCanManageTarget(currentAdmin, record);
    }
    if (
      status !== "active" &&
      records.some((record) =>
        record.roles.some(({ role }) => role.key === "admin"),
      )
    ) {
      await this.assertActiveAdminWillRemain(ids);
    }

    await this.prisma.$transaction([
      this.prisma.user.updateMany({
        where: { id: { in: ids }, status: { not: status } },
        data: { status, tokenVersion: { increment: 1 } },
      }),
      this.prisma.authSession.updateMany({
        where: { userId: { in: ids }, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    return { updated: ids.length };
  }

  async updateAccess(
    currentAdmin: AuthenticatedUser,
    id: number,
    dto: UpdateUserAccessDto,
  ) {
    return this.update(currentAdmin, id, {
      roles: dto.roles,
      permissions: dto.permissions,
    });
  }

  async verifyEmail(id: number) {
    await this.assertExists(id);
    await this.prisma.user.update({
      where: { id },
      data: { emailVerifiedAt: new Date() },
    });
    return this.findOne(id);
  }

  async revokeSessions(currentAdmin: AuthenticatedUser, id: number) {
    await this.assertExists(id);
    if (currentAdmin.id === id) {
      throw new BadRequestException(
        "Hãy dùng chức năng đăng xuất tất cả thiết bị trong cài đặt tài khoản.",
      );
    }
    const now = new Date();
    const [, sessions] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { tokenVersion: { increment: 1 } },
      }),
      this.prisma.authSession.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);
    return { id, revokedSessions: sessions.count };
  }

  async remove(currentAdmin: AuthenticatedUser, id: number) {
    const record = await this.findRemovableRecord(id);
    await this.assertCanRemove(currentAdmin, record, [id]);
    try {
      await this.prisma.user.delete({ where: { id } });
      return { id, deleted: true as const };
    } catch (error) {
      this.rethrowPersistenceError(error);
      throw error;
    }
  }

  async removeMany(currentAdmin: AuthenticatedUser, inputIds: number[]) {
    const ids = this.uniqueIds(inputIds);
    const records = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        roles: { select: { role: { select: { key: true } } } },
        _count: { select: { links: true } },
      },
    });
    if (records.length !== ids.length) {
      throw new NotFoundException("Một hoặc nhiều người dùng không tồn tại.");
    }
    for (const record of records) {
      await this.assertCanRemove(currentAdmin, record, ids);
    }
    try {
      const result = await this.prisma.user.deleteMany({
        where: { id: { in: ids } },
      });
      return { deleted: result.count };
    } catch (error) {
      this.rethrowPersistenceError(error);
      throw error;
    }
  }

  private buildAdvancedWhere(
    filters: UserFilterDto[],
    joinOperator: "and" | "or",
  ): Prisma.UserWhereInput | undefined {
    const conditions = filters
      .map((filter) => this.buildFilterCondition(filter))
      .filter(
        (condition): condition is Prisma.UserWhereInput => Boolean(condition),
      );
    if (!conditions.length) return undefined;
    return joinOperator === "or" ? { OR: conditions } : { AND: conditions };
  }

  private buildFilterCondition(
    filter: UserFilterDto,
  ): Prisma.UserWhereInput | undefined {
    if (
      ["createdAt", "updatedAt", "emailVerifiedAt"].includes(filter.id)
    ) {
      return this.buildDateFilter(filter);
    }
    if (filter.id === "role") return this.buildRoleFilter(filter);
    if (filter.id === "id" || filter.id === "balance") {
      return this.buildNumberFilter(filter);
    }

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

  private buildNumberFilter(
    filter: UserFilterDto,
  ): Prisma.UserWhereInput | undefined {
    const raw = Array.isArray(filter.value) ? filter.value[0] : filter.value;
    const value = Number(raw);
    if (!Number.isFinite(value)) return undefined;
    const field = filter.id as "id" | "balance";
    if (field === "id" && !Number.isSafeInteger(value)) return undefined;
    if (filter.operator === "eq") {
      return { [field]: { equals: value } } as Prisma.UserWhereInput;
    }
    if (filter.operator === "ne") {
      return { [field]: { not: value } } as Prisma.UserWhereInput;
    }
    if (["lt", "lte", "gt", "gte"].includes(filter.operator)) {
      return {
        [field]: { [filter.operator]: value },
      } as Prisma.UserWhereInput;
    }
    if (
      field === "balance" &&
      filter.operator === "isBetween" &&
      Array.isArray(filter.value) &&
      filter.value.length === 2
    ) {
      const minimum = Number(filter.value[0]);
      const maximum = Number(filter.value[1]);
      if (!Number.isFinite(minimum) || !Number.isFinite(maximum)) {
        return undefined;
      }
      return { balance: { gte: minimum, lte: maximum } };
    }
    return undefined;
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

  private buildDateFilter(
    filter: UserFilterDto,
  ): Prisma.UserWhereInput | undefined {
    const field = filter.id as "createdAt" | "updatedAt" | "emailVerifiedAt";
    const value = typeof filter.value === "string" ? filter.value : undefined;
    const values = Array.isArray(filter.value) ? filter.value : undefined;
    if (
      field === "emailVerifiedAt" &&
      filter.variant === "boolean" &&
      (filter.operator === "eq" || filter.operator === "ne") &&
      (value === "true" || value === "false")
    ) {
      const expectsVerified =
        filter.operator === "eq" ? value === "true" : value !== "true";
      return expectsVerified
        ? { emailVerifiedAt: { not: null } }
        : { emailVerifiedAt: null };
    }
    if (filter.operator === "isEmpty") {
      return field === "emailVerifiedAt" ? { emailVerifiedAt: null } : undefined;
    }
    if (filter.operator === "isNotEmpty") {
      return field === "emailVerifiedAt"
        ? { emailVerifiedAt: { not: null } }
        : undefined;
    }
    const date = value ? this.parseDateValue(value) : null;
    let condition: Prisma.DateTimeNullableFilter | undefined;
    switch (filter.operator) {
      case "eq":
        condition = date
          ? { gte: this.startOfDay(date), lte: this.endOfDay(date) }
          : undefined;
        break;
      case "ne":
        return date
          ? {
              OR: [
                { [field]: { lt: this.startOfDay(date) } },
                { [field]: { gt: this.endOfDay(date) } },
              ],
            }
          : undefined;
      case "lt":
      case "lte":
      case "gt":
      case "gte":
        condition = date
          ? {
              [filter.operator]:
                filter.operator === "lt" || filter.operator === "lte"
                  ? this.endOfDay(date)
                  : this.startOfDay(date),
            }
          : undefined;
        break;
      case "isBetween": {
        if (!values || values.length !== 2) return undefined;
        const start = values[0] ? this.parseDateValue(values[0]) : null;
        const end = values[1] ? this.parseDateValue(values[1]) : null;
        if (!start && !end) return undefined;
        condition = {
          ...(start ? { gte: this.startOfDay(start) } : {}),
          ...(end ? { lte: this.endOfDay(end) } : {}),
        };
        break;
      }
      case "isRelativeToToday": {
        if (!value) return undefined;
        const [amountValue, unit] = value.split(" ");
        const amount = Number.parseInt(amountValue || "", 10);
        const multiplier =
          unit === "weeks" ? 7 : unit === "months" ? 30 : unit === "days" ? 1 : 0;
        if (!Number.isFinite(amount) || !multiplier) return undefined;
        const start = new Date();
        start.setDate(start.getDate() + amount * multiplier);
        const end = new Date(start);
        end.setDate(
          end.getDate() + (unit === "weeks" ? 6 : unit === "months" ? 29 : 0),
        );
        condition = {
          gte: this.startOfDay(start),
          lte: this.endOfDay(end),
        };
        break;
      }
      default:
        return undefined;
    }
    return condition ? ({ [field]: condition } as Prisma.UserWhereInput) : undefined;
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

  private async findSecurityRecord(id: number) {
    const record = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        status: true,
        roles: { select: { role: { select: { key: true } } } },
        permissions: {
          select: { permission: { select: { key: true } } },
        },
      },
    });
    if (!record) throw new NotFoundException("Không tìm thấy người dùng.");
    return record;
  }

  private async findSecurityRecords(ids: number[]) {
    const records = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        email: true,
        status: true,
        roles: { select: { role: { select: { key: true } } } },
        permissions: {
          select: { permission: { select: { key: true } } },
        },
      },
    });
    if (records.length !== ids.length) {
      throw new NotFoundException("Một hoặc nhiều người dùng không tồn tại.");
    }
    return records;
  }

  private async findRemovableRecord(id: number) {
    const record = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        roles: { select: { role: { select: { key: true } } } },
        _count: { select: { links: true } },
      },
    });
    if (!record) throw new NotFoundException("Không tìm thấy người dùng.");
    return record;
  }

  private async assertCanRemove(
    currentAdmin: AuthenticatedUser,
    record: {
      id: number;
      roles: Array<{ role: { key: string } }>;
      _count: { links: number };
    },
    removalIds: number[],
  ) {
    if (currentAdmin.id === record.id) {
      throw new BadRequestException(
        "Bạn không thể xóa tài khoản đang đăng nhập.",
      );
    }
    this.assertCanManageTarget(currentAdmin, record);
    if (record._count.links > 0) {
      throw new ConflictException(
        "Không thể xóa người dùng đang sở hữu nội dung. Hãy vô hiệu hóa tài khoản thay vì xóa.",
      );
    }
    if (record.roles.some(({ role }) => role.key === "admin")) {
      await this.assertActiveAdminWillRemain(removalIds);
    }
  }

  private assertCanManageTarget(
    currentAdmin: AuthenticatedUser,
    target: { id: number; roles: Array<{ role: { key: string } }> },
  ) {
    if (
      target.roles.some(({ role }) => role.key === "admin") &&
      !currentAdmin.roles.includes("admin")
    ) {
      throw new ForbiddenException(
        "Chỉ Administrator mới có thể quản lý tài khoản Administrator.",
      );
    }
  }

  private assertNotMutatingOwnAccess(
    currentAdminId: number,
    targetId: number,
    dto: UpdateUserDto,
  ) {
    if (
      currentAdminId === targetId &&
      (dto.roles ||
        dto.permissions ||
        (dto.status !== undefined && dto.status !== "active"))
    ) {
      throw new BadRequestException(
        "Bạn không thể tự thay đổi quyền hoặc vô hiệu hóa tài khoản đang đăng nhập.",
      );
    }
  }

  private assertPermission(user: AuthenticatedUser, permission: string) {
    if (!user.permissions.includes(permission)) {
      throw new ForbiddenException(
        "Bạn không có quyền thực hiện thao tác này.",
      );
    }
  }

  private async assertActiveAdminWillRemain(excludedUserIds: number[]) {
    const count = await this.prisma.user.count({
      where: {
        id: { notIn: excludedUserIds },
        roles: { some: { role: { key: "admin" } } },
        status: "active",
      },
    });
    if (!count) {
      throw new ConflictException(
        "Hệ thống phải luôn còn ít nhất một admin hoạt động.",
      );
    }
  }

  private async resolveAssignments(
    currentAdmin: AuthenticatedUser,
    roleKeys: string[],
    permissionKeys: string[],
  ) {
    const uniqueRoleKeys = [...new Set(roleKeys)];
    const uniquePermissionKeys = [...new Set(permissionKeys)];
    const [roles, permissions] = await Promise.all([
      this.prisma.role.findMany({
        where: { key: { in: uniqueRoleKeys } },
        select: {
          id: true,
          key: true,
          permissions: {
            select: { permission: { select: { key: true } } },
          },
        },
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
    if (!currentAdmin.roles.includes("admin")) {
      if (roles.some((role) => role.key === "admin")) {
        throw new ForbiddenException(
          "Chỉ Administrator mới có thể gán role Administrator.",
        );
      }
      const granted = new Set(currentAdmin.permissions);
      const assignedPermissions = new Set([
        ...permissions.map((permission) => permission.key),
        ...roles.flatMap((role) =>
          role.permissions.map(({ permission }) => permission.key),
        ),
      ]);
      const excessive = [...assignedPermissions].filter(
        (permission) => !granted.has(permission),
      );
      if (excessive.length) {
        throw new ForbiddenException(
          "Bạn không thể gán quyền cao hơn phạm vi quyền hiện tại.",
        );
      }
    }
    return {
      roleIds: roles.map((role) => role.id),
      permissionIds: permissions.map((permission) => permission.id),
    };
  }

  private async assertExists(id: number) {
    const exists = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException("Không tìm thấy người dùng.");
  }

  private uniqueIds(inputIds: number[]) {
    return [...new Set(inputIds)];
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

  private toResponse(user: UserRecord) {
    const authorization = resolveUserAuthorization(user);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt,
      emailVerified: Boolean(user.emailVerifiedAt),
      avatar: user.avatar,
      balance: user.balance.toString(),
      status: user.status,
      role: authorization.role,
      roles: user.roles.map(({ role }) => ({
        id: role.id,
        key: role.key,
        name: role.name,
      })),
      directPermissions: user.permissions.map(
        ({ permission }) => permission.key,
      ),
      permissions: authorization.permissions,
      linksCount: user._count?.links || 0,
      activeSessionsCount: user._count?.authSessions || 0,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private rethrowPersistenceError(error: unknown): never | void {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return;
    if (error.code === "P2002") {
      throw new ConflictException("Email đã được sử dụng.");
    }
    if (error.code === "P2003") {
      throw new ConflictException(
        "Không thể xóa người dùng vì vẫn còn dữ liệu liên quan.",
      );
    }
  }
}
