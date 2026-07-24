import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from "@nestjs/common";
import { Prisma, type AdminMedia } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";

import { PrismaService } from "../../database/prisma/prisma.service";
import { AdminMediaFolderService } from "./admin-media-folder.service";
import { AdminMediaStorageService } from "./admin-media-storage.service";
import type {
  BulkMoveAdminMediaDto,
  QueryAdminMediaDto,
  UpdateAdminMediaDto,
} from "./dto/admin-media.dto";

@Injectable()
export class AdminMediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly folders: AdminMediaFolderService,
    private readonly storage: AdminMediaStorageService,
  ) {}

  async findAll(query: QueryAdminMediaDto) {
    const search = query.search?.trim();
    const folderId = query.folderId;
    const where: Prisma.AdminMediaWhereInput = {
      deletedAt: null,
      ...(folderId === "all"
        ? {}
        : { folderId: folderId === undefined ? null : folderId }),
      ...(query.type
        ? query.type === "image"
          ? { mimeType: { startsWith: "image/" } }
          : { mimeType: query.type }
        : {}),
      ...(search
        ? {
            OR: [
              { fileName: { contains: search } },
              { originalName: { contains: search } },
              { altText: { contains: search } },
            ],
          }
        : {}),
    };
    const skip = (query.page - 1) * query.limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.adminMedia.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { [query.sortBy]: query.sortOrder },
      }),
      this.prisma.adminMedia.count({ where }),
    ]);
    return {
      items: items.map((item) => this.toResponse(item)),
      page: query.page,
      limit: query.limit,
      total,
      pageCount: Math.max(1, Math.ceil(total / query.limit)),
    };
  }

  async findOne(id: string) {
    return this.toResponse(await this.findRecord(id));
  }

  async upload(
    files: Express.Multer.File[],
    folderId: string | null,
    adminId: number,
  ) {
    if (!files.length) {
      throw new BadRequestException({
        code: "INVALID_MEDIA_FILE",
        message: "Vui lòng chọn ít nhất một ảnh.",
      });
    }
    await this.folders.assertFolder(folderId);

    const created: AdminMedia[] = [];
    for (const file of files) {
      const image = this.storage.validateImage(file);
      const id = randomUUID();
      const storageKey = this.storage.buildStorageKey(
        folderId,
        image.extension,
      );
      await this.storage.write(storageKey, file.buffer);
      try {
        const media = await this.prisma.adminMedia.create({
          data: {
            id,
            folderId,
            fileName: this.cleanFileName(file.originalname),
            originalName: this.cleanFileName(file.originalname),
            mimeType: image.mimeType,
            extension: image.extension,
            size: file.size,
            storageKey,
            url: `/api/admin-media/${id}`,
            thumbnailUrl: `/api/admin-media/${id}`,
            width: image.width,
            height: image.height,
            uploadedBy: adminId,
          },
        });
        created.push(media);
      } catch (error) {
        await this.storage.remove(storageKey);
        throw error;
      }
    }
    return { items: created.map((item) => this.toResponse(item)) };
  }

  async update(id: string, dto: UpdateAdminMediaDto) {
    await this.findRecord(id);
    const file = await this.prisma.adminMedia.update({
      where: { id },
      data: {
        ...(dto.fileName !== undefined
          ? { fileName: this.cleanFileName(dto.fileName) }
          : {}),
        ...(dto.altText !== undefined
          ? { altText: this.emptyToNull(dto.altText) }
          : {}),
        ...(dto.caption !== undefined
          ? { caption: this.emptyToNull(dto.caption) }
          : {}),
      },
    });
    return this.toResponse(file);
  }

  async move(id: string, folderId: string | null) {
    await this.findRecord(id);
    await this.folders.assertFolder(folderId);
    const file = await this.prisma.adminMedia.update({
      where: { id },
      data: { folderId },
    });
    return this.toResponse(file);
  }

  async bulkMove(dto: BulkMoveAdminMediaDto) {
    const ids = this.uniqueIds(dto.ids);
    const folderId = dto.folderId ?? null;
    await this.folders.assertFolder(folderId);
    await this.assertAllExist(ids);
    const result = await this.prisma.adminMedia.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { folderId },
    });
    return { moved: result.count, folderId };
  }

  async remove(id: string) {
    const file = await this.findRecord(id);
    await this.assertNotInUse(file);
    await this.prisma.adminMedia.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.storage.remove(file.storageKey);
    return { id, deleted: true };
  }

  async bulkRemove(idsInput: string[]) {
    const ids = this.uniqueIds(idsInput);
    await this.assertAllExist(ids);
    const files = await this.prisma.adminMedia.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });
    for (const file of files) await this.assertNotInUse(file);
    await this.prisma.adminMedia.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    await Promise.all(files.map((file) => this.storage.remove(file.storageKey)));
    return { deleted: files.length };
  }

  async download(id: string) {
    const file = await this.findRecord(id);
    const buffer = await this.storage.read(file.storageKey).catch(() => {
      throw new NotFoundException({
        code: "ADMIN_MEDIA_CONTENT_NOT_FOUND",
        message: "Không tìm thấy nội dung file Admin Media.",
      });
    });
    return {
      file,
      stream: new StreamableFile(buffer),
    };
  }

  private async assertNotInUse(file: AdminMedia) {
    const [settings, featuredPages, contentPages, userAvatars] =
      await this.prisma.$transaction([
        this.prisma.websiteSettings.count({
          where: {
            OR: [
              { logoLightId: file.id },
              { logoDarkId: file.id },
              { logoIconId: file.id },
              { faviconId: file.id },
              { defaultOgImageId: file.id },
            ],
          },
        }),
        this.prisma.page.count({
          where: { featuredImageId: file.id, deletedAt: null },
        }),
        this.prisma.page.count({
          where: {
            deletedAt: null,
            OR: [
              { contentHtml: { contains: file.id } },
              { contentJson: { contains: file.id } },
            ],
          },
        }),
        this.prisma.user.count({
          where: { avatar: { contains: file.id } },
        }),
      ]);
    const usageCount = settings + featuredPages + contentPages + userAvatars;
    if (usageCount > 0) {
      throw new ConflictException({
        code: "MEDIA_IN_USE",
        message: "File đang được sử dụng và chưa thể xóa.",
        usageCount,
        usages: { settings, featuredPages, contentPages, userAvatars },
      });
    }
  }

  private async findRecord(id: string) {
    const file = await this.prisma.adminMedia.findFirst({
      where: { id, deletedAt: null },
    });
    if (!file) {
      throw new NotFoundException({
        code: "ADMIN_MEDIA_NOT_FOUND",
        message: "Không tìm thấy file Admin Media.",
      });
    }
    return file;
  }

  private async assertAllExist(ids: string[]) {
    const count = await this.prisma.adminMedia.count({
      where: { id: { in: ids }, deletedAt: null },
    });
    if (count !== ids.length) {
      throw new NotFoundException({
        code: "ADMIN_MEDIA_NOT_FOUND",
        message: "Một hoặc nhiều file Admin Media không tồn tại.",
      });
    }
  }

  private uniqueIds(ids: string[]) {
    const result = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
    if (!result.length) {
      throw new BadRequestException("Danh sách Media không được để trống.");
    }
    return result;
  }

  private cleanFileName(value: string) {
    const name = value
      .split(/[\\/]/)
      .pop()
      ?.trim()
      .replace(/\s+/g, " ")
      .slice(0, 255);
    if (!name || name === "." || name === "..") {
      return `image-${Date.now()}${extname(value).toLowerCase()}`;
    }
    return name;
  }

  private emptyToNull(value: string | null) {
    return value?.trim() || null;
  }

  private toResponse(file: AdminMedia) {
    return {
      id: file.id,
      folderId: file.folderId,
      fileName: file.fileName,
      originalName: file.originalName,
      mimeType: file.mimeType,
      extension: file.extension,
      size: file.size,
      sizeLabel: this.formatBytes(file.size),
      url: file.url,
      thumbnailUrl: file.thumbnailUrl,
      width: file.width,
      height: file.height,
      altText: file.altText,
      caption: file.caption,
      uploadedBy: file.uploadedBy,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };
  }

  private formatBytes(size: number) {
    if (size === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const unit = Math.min(
      Math.floor(Math.log(size) / Math.log(1024)),
      units.length - 1,
    );
    const value = size / 1024 ** unit;
    return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
  }
}
