import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { permissionCatalog } from "@stu/contracts";

import { PrismaService } from "../../database/prisma/prisma.service";
import type { CreateRoleDto } from "./dto/create-role.dto";
import type { UpdateRoleDto } from "./dto/update-role.dto";

const roleInclude = {
  permissions: {
    include: { permission: true },
    orderBy: { permission: { key: "asc" as const } },
  },
  _count: { select: { users: true } },
} satisfies Prisma.RoleInclude;

@Injectable()
export class AuthorizationService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.syncSystemCatalog();
  }

  async listRoles() {
    const roles = await this.prisma.role.findMany({
      include: roleInclude,
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    });
    return roles.map((role) => this.toRoleResponse(role));
  }

  listPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ group: "asc" }, { key: "asc" }],
    });
  }

  async createRole(dto: CreateRoleDto) {
    const permissionIds = await this.resolvePermissionIds(dto.permissionKeys);
    try {
      const role = await this.prisma.role.create({
        data: {
          key: dto.key,
          name: dto.name,
          description: dto.description || null,
          permissions: {
            create: permissionIds.map((permissionId) => ({
              permissionId,
            })),
          },
        },
        include: roleInclude,
      });
      return this.toRoleResponse(role);
    } catch (error) {
      this.rethrowUniqueRole(error);
      throw error;
    }
  }

  async updateRole(id: number, dto: UpdateRoleDto) {
    const existing = await this.prisma.role.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Không tìm thấy role.");

    const permissionKeys =
      dto.permissionKeys && existing.key === "admin"
        ? permissionCatalog.map((permission) => permission.key)
        : dto.permissionKeys;
    const permissionIds = permissionKeys
      ? await this.resolvePermissionIds(permissionKeys)
      : null;

    await this.prisma.$transaction(async (prisma) => {
      await prisma.role.update({
        where: { id },
        data: {
          ...(dto.name ? { name: dto.name } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description || null }
            : {}),
        },
      });
      if (permissionIds) {
        await prisma.roleHasPermission.deleteMany({ where: { roleId: id } });
        if (permissionIds.length) {
          await prisma.roleHasPermission.createMany({
            data: permissionIds.map((permissionId) => ({
              roleId: id,
              permissionId,
            })),
          });
        }
      }
    });

    return this.findRole(id);
  }

  async deleteRole(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!role) throw new NotFoundException("Không tìm thấy role.");
    if (role.isSystem) {
      throw new ConflictException("Không thể xóa role hệ thống.");
    }
    if (role._count.users > 0) {
      throw new ConflictException(
        "Không thể xóa role đang được gán cho người dùng.",
      );
    }
    await this.prisma.role.delete({ where: { id } });
    return { id, deleted: true as const };
  }

  private async findRole(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: roleInclude,
    });
    if (!role) throw new NotFoundException("Không tìm thấy role.");
    return this.toRoleResponse(role);
  }

  private async resolvePermissionIds(keys: string[]) {
    const uniqueKeys = [...new Set(keys)];
    const permissions = await this.prisma.permission.findMany({
      where: { key: { in: uniqueKeys } },
      select: { id: true, key: true },
    });
    if (permissions.length !== uniqueKeys.length) {
      const found = new Set(permissions.map((permission) => permission.key));
      const missing = uniqueKeys.filter((key) => !found.has(key));
      throw new NotFoundException(
        `Permission không tồn tại: ${missing.join(", ")}.`,
      );
    }
    return permissions.map((permission) => permission.id);
  }

  private async syncSystemCatalog() {
    await this.prisma.$transaction(async (prisma) => {
      for (const permission of permissionCatalog) {
        await prisma.permission.upsert({
          where: { key: permission.key },
          update: {
            name: permission.name,
            description: permission.description,
            group: permission.group,
          },
          create: permission,
        });
      }

      await prisma.role.upsert({
        where: { key: "admin" },
        update: { isSystem: true },
        create: {
          key: "admin",
          name: "Administrator",
          description: "Toàn quyền quản trị hệ thống.",
          isSystem: true,
        },
      });
      await prisma.role.upsert({
        where: { key: "member" },
        update: { isSystem: true },
        create: {
          key: "member",
          name: "Member",
          description: "Tài khoản thành viên mặc định.",
          isSystem: true,
        },
      });

      const admin = await prisma.role.findUniqueOrThrow({
        where: { key: "admin" },
      });
      const permissions = await prisma.permission.findMany({
        select: { id: true },
      });
      for (const permission of permissions) {
        await prisma.roleHasPermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: admin.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: admin.id,
            permissionId: permission.id,
          },
        });
      }
    });
  }

  private toRoleResponse(role: Prisma.RoleGetPayload<{
    include: typeof roleInclude;
  }>) {
    return {
      id: role.id,
      key: role.key,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      usersCount: role._count.users,
      permissionKeys: role.permissions.map(
        (assignment) => assignment.permission.key,
      ),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  private rethrowUniqueRole(error: unknown): never | void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictException("Role key đã tồn tại.");
    }
  }
}
