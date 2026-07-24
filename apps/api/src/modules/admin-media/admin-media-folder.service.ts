import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PrismaService } from "../../database/prisma/prisma.service";
import type {
  CreateAdminMediaFolderDto,
  UpdateAdminMediaFolderDto,
} from "./dto/admin-media-folder.dto";

@Injectable()
export class AdminMediaFolderService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const folders = await this.prisma.adminMediaFolder.findMany({
      where: { deletedAt: null },
      orderBy: [{ parentId: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            media: { where: { deletedAt: null } },
            children: { where: { deletedAt: null } },
          },
        },
      },
    });
    return {
      items: folders.map((folder) => ({
        id: folder.id,
        name: folder.name,
        parentId: folder.parentId,
        fileCount: folder._count.media,
        childCount: folder._count.children,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
      })),
    };
  }

  async create(dto: CreateAdminMediaFolderDto, adminId: number) {
    const name = this.cleanName(dto.name);
    const parentId = dto.parentId ?? null;
    if (parentId) await this.findRecord(parentId);
    await this.assertNameAvailable(name, parentId);

    const folder = await this.prisma.adminMediaFolder.create({
      data: {
        name,
        normalizedName: this.normalizeName(name),
        parentId,
        parentScope: parentId || "root",
        createdBy: adminId,
      },
    });
    return { ...folder, fileCount: 0, childCount: 0 };
  }

  async update(id: string, dto: UpdateAdminMediaFolderDto) {
    const current = await this.findRecord(id);
    const name =
      dto.name === undefined ? current.name : this.cleanName(dto.name);
    const parentId =
      dto.parentId === undefined ? current.parentId : dto.parentId ?? null;

    if (parentId === id) {
      throw new BadRequestException({
        code: "INVALID_FOLDER_PARENT",
        message: "Không thể di chuyển thư mục vào chính nó.",
      });
    }
    if (parentId) {
      await this.findRecord(parentId);
      await this.assertNotDescendant(id, parentId);
    }
    if (name !== current.name || parentId !== current.parentId) {
      await this.assertNameAvailable(name, parentId, id);
    }

    return this.prisma.adminMediaFolder.update({
      where: { id },
      data: {
        name,
        normalizedName: this.normalizeName(name),
        parentId,
        parentScope: parentId || "root",
      },
    });
  }

  async remove(id: string) {
    const folder = await this.findRecord(id);
    const [fileCount, childCount] = await this.prisma.$transaction([
      this.prisma.adminMedia.count({
        where: { folderId: id, deletedAt: null },
      }),
      this.prisma.adminMediaFolder.count({
        where: { parentId: id, deletedAt: null },
      }),
    ]);
    if (fileCount > 0 || childCount > 0) {
      throw new ConflictException({
        code: "FOLDER_NOT_EMPTY",
        message: "Hãy di chuyển file và thư mục con trước khi xóa thư mục.",
        fileCount,
        childCount,
      });
    }

    await this.prisma.adminMediaFolder.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        normalizedName: `${folder.normalizedName}--deleted-${folder.id}`,
        parentScope: `${folder.parentScope}--deleted-${folder.id}`,
      },
    });
    return { id, deleted: true };
  }

  async assertFolder(folderId: string | null | undefined) {
    if (!folderId) return null;
    return this.findRecord(folderId);
  }

  private async findRecord(id: string) {
    const folder = await this.prisma.adminMediaFolder.findFirst({
      where: { id, deletedAt: null },
    });
    if (!folder) {
      throw new NotFoundException({
        code: "ADMIN_MEDIA_FOLDER_NOT_FOUND",
        message: "Không tìm thấy thư mục Admin Media.",
      });
    }
    return folder;
  }

  private async assertNameAvailable(
    name: string,
    parentId: string | null,
    excludedId?: string,
  ) {
    const existing = await this.prisma.adminMediaFolder.findFirst({
      where: {
        parentScope: parentId || "root",
        normalizedName: this.normalizeName(name),
        deletedAt: null,
        ...(excludedId ? { id: { not: excludedId } } : {}),
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException({
        code: "FOLDER_NAME_EXISTS",
        message: "Tên thư mục đã tồn tại trong cùng cấp.",
      });
    }
  }

  private async assertNotDescendant(folderId: string, parentId: string) {
    let cursor: string | null = parentId;
    const visited = new Set<string>();
    while (cursor) {
      if (cursor === folderId) {
        throw new BadRequestException({
          code: "FOLDER_CYCLE",
          message: "Không thể di chuyển thư mục vào thư mục con của nó.",
        });
      }
      if (visited.has(cursor)) break;
      visited.add(cursor);
      const parent: { parentId: string | null } | null =
        await this.prisma.adminMediaFolder.findFirst({
          where: { id: cursor, deletedAt: null },
          select: { parentId: true },
        });
      cursor = parent?.parentId ?? null;
    }
  }

  private cleanName(value: string) {
    const name = value.trim().replace(/\s+/g, " ");
    if (!name) {
      throw new BadRequestException({
        code: "INVALID_FOLDER_NAME",
        message: "Tên thư mục không được để trống.",
      });
    }
    return name.slice(0, 100);
  }

  private normalizeName(value: string) {
    return value.normalize("NFKC").toLocaleLowerCase("vi-VN");
  }
}
