import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  StreamableFile,
  UnsupportedMediaTypeException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma, type MemberFile } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, unlink } from "node:fs/promises";
import { basename, dirname, extname, isAbsolute, join, resolve } from "node:path";

import { PrismaService } from "../../database/prisma/prisma.service";
import { BusinessSettingsService } from "../business-settings/business-settings.service";
import { ListFilesQueryDto } from "./dto/list-files-query.dto";
import { UpdateFileDto } from "./dto/update-file.dto";

export type UploadedDiskFile = {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
  storageKey?: string;
  purpose?: "file" | "cover";
};

export function normalizeFileAlias(value: string): string {
  const map: Record<string, string> = {
    đ: "d", Đ: "D", æ: "ae", Æ: "AE", œ: "oe", Œ: "OE", ø: "o",
    Ø: "O", ł: "l", Ł: "L", ß: "ss", ẞ: "SS", ð: "d", Ð: "D",
    þ: "th", Þ: "TH",
  };

  return value
    .split(/[\\/]/u).pop()!.trim()
    .replace(/(?<!^)\.[^\s./\\]+$/u, "")
    .replace(/[đĐæÆœŒøØłŁßẞðÐþÞ]/gu, (character) => map[character] ?? character)
    .normalize("NFKD").replace(/\p{M}+/gu, "")
    .toLocaleLowerCase("vi-VN")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}

export function buildStoredFileName(originalName: string) {
  const extension = extname(originalName).toLowerCase();
  const base = normalizeFileAlias(basename(originalName, extension)).slice(0, 64);
  return `${base || "file"}-${randomBytes(8).toString("hex")}${extension}`;
}

type FileWithUsage = MemberFile & { _count?: { destinationLinks: number } };

export type LinkAppearanceMediaKind = "cover" | "background";

export function extractMemberPreviewFileId(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const path = new URL(value, "http://link4sub.internal").pathname;
    const match =
      /^\/(?:api\/backend\/)?member\/files\/(\d+)\/preview\/?$/.exec(path);
    if (!match) return null;

    const fileId = Number(match[1]);
    return Number.isSafeInteger(fileId) && fileId > 0 ? fileId : null;
  } catch {
    return null;
  }
}

export function getLinkAppearanceMediaFileId(
  appearanceJson: string,
  kind: LinkAppearanceMediaKind,
) {
  try {
    const appearance = JSON.parse(appearanceJson) as {
      coverImageUrl?: unknown;
      backgroundSettings?: {
        backgroundMediaUrl?: unknown;
        sameAsCoverImage?: unknown;
      };
    };
    const background = appearance.backgroundSettings;
    const value =
      kind === "cover" || background?.sameAsCoverImage === true
        ? appearance.coverImageUrl
        : background?.backgroundMediaUrl;

    return extractMemberPreviewFileId(value);
  } catch {
    return null;
  }
}

@Injectable()
export class FilesService {
  private readonly uploadRoot: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly businessSettings: BusinessSettingsService,
  ) {
    this.uploadRoot = resolve(
      this.configService.get<string>("MEMBER_FILES_UPLOAD_DIR") ||
        join(process.cwd(), "uploads", "member-files"),
    );
  }

  async ensureUploadRoot() {
    await mkdir(this.uploadRoot, { recursive: true });
    return this.uploadRoot;
  }

  async create(
    userId: number,
    uploadedFile: UploadedDiskFile,
    purpose: "file" | "cover" = uploadedFile.purpose || "file",
    reservationUploadId?: string,
  ) {
    const settings = await this.businessSettings.getRuntime();
    const extension = extname(uploadedFile.originalname).replace(/^\./, "").toLowerCase();
    const name = this.cleanFileName(uploadedFile.originalname);
    const alias = await this.createUniqueAlias(userId, name);
    const size = BigInt(uploadedFile.size);
    const storageKey = uploadedFile.storageKey || this.toStorageKey(uploadedFile.path);

    const file = await this.prisma.$transaction(async (prisma) => {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException("Không tìm thấy tài khoản.");

      if (reservationUploadId) {
        const upload = await prisma.memberFileUpload.findFirst({
          where: { id: reservationUploadId, userId, status: "completed" },
        });
        if (!upload || upload.size !== uploadedFile.size) {
          throw new BadRequestException("Phiên upload không hợp lệ hoặc đã hết hạn.");
        }
      } else {
        this.assertWithinQuota(user.storageLimitBytes, user.storageUsedBytes, user.storageReservedBytes, size, BigInt(settings.memberStorageQuotaBytes));
      }

      const created = await prisma.memberFile.create({
        data: {
          userId,
          alias,
          name,
          originalName: uploadedFile.originalname,
          extension: extension || null,
          mimeType: uploadedFile.mimetype,
          size: uploadedFile.size,
          storageKey,
          purpose,
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: {
          storageUsedBytes: { increment: size },
          ...(reservationUploadId
            ? { storageReservedBytes: { decrement: size } }
            : {}),
        },
      });
      if (reservationUploadId) {
        await prisma.memberFileUpload.delete({ where: { id: reservationUploadId } });
      }
      return created;
    });

    return this.toResponse(file);
  }

  async findAll(userId: number, query: ListFilesQueryDto) {
    const settings = await this.businessSettings.getRuntime();
    const page = query.page || 1;
    const limit = query.limit || 20;
    const constraints: Prisma.MemberFileWhereInput[] = [
      this.typeWhere(query.type),
      this.stateWhere(query.state),
    ];
    const where: Prisma.MemberFileWhereInput = {
      userId,
      deletedAt: query.status === "trash" ? { not: null } : null,
      AND: constraints,
    };

    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { name: { contains: q } },
        { originalName: { contains: q } },
        { extension: { contains: q } },
        { alias: { contains: q } },
      ];
    }

    const [files, totalItems, user] = await this.prisma.$transaction([
      this.prisma.memberFile.findMany({
        where,
        orderBy: this.orderBy(query.sort || "date", query.direction || "desc"),
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { destinationLinks: true } } },
      }),
      this.prisma.memberFile.count({ where }),
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { storageLimitBytes: true, storageUsedBytes: true, storageReservedBytes: true },
      }),
    ]);

    const summary = this.toStorageSummary(user, BigInt(settings.memberStorageQuotaBytes));
    return {
      items: files.map((file) => this.toResponse(file)),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / limit)),
      },
      summary,
      // Compatibility fields for clients while they migrate to pagination/summary.
      total: totalItems,
      totalSize: summary.usedBytes,
    };
  }

  async findOwned(userId: number, idOrAlias: string) {
    const numericId = this.tryParseId(idOrAlias);
    const file = await this.prisma.memberFile.findFirst({
      where: {
        userId,
        deletedAt: null,
        OR: [...(numericId ? [{ id: numericId }] : []), { alias: idOrAlias }],
      },
    });
    if (!file) throw new NotFoundException("Không tìm thấy file.");
    return file;
  }

  async update(userId: number, id: string, dto: UpdateFileDto) {
    const fileId = this.parseId(id);
    await this.assertOwned(userId, fileId);
    return this.toResponse(await this.prisma.memberFile.update({
      where: { id: fileId },
      data: {
        ...(dto.name !== undefined ? { name: this.cleanFileName(dto.name) } : {}),
      },
      include: { _count: { select: { destinationLinks: true } } },
    }));
  }

  async remove(userId: number, id: string) {
    const fileId = this.parseId(id);
    const file = await this.assertOwned(userId, fileId);
    await this.assertNotInUse([fileId]);
    const updated = await this.prisma.memberFile.update({
      where: { id: fileId },
      data: { deletedAt: new Date() },
    });
    return { ...this.toResponse(updated), retainedBytes: file.size };
  }

  async removeMany(userId: number, ids: string[]) {
    const fileIds = this.parseIds(ids);
    await this.assertAllOwned(userId, fileIds);
    await this.assertNotInUse(fileIds);
    await this.prisma.memberFile.updateMany({
      where: { id: { in: fileIds }, userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return { ids: fileIds.map(String), deleted: true };
  }

  async previewOwned(userId: number, idOrAlias: string) {
    const file = await this.findOwned(userId, idOrAlias);
    if (!file.mimeType.startsWith("image/") && !file.mimeType.startsWith("video/")) {
      throw new UnsupportedMediaTypeException("Chỉ hỗ trợ xem trước ảnh và video.");
    }
    return {
      file: this.toResponse(file),
      stream: new StreamableFile(createReadStream(this.resolveStoragePath(file.storageKey))),
    };
  }

  async previewPublishedImage(fileId: number) {
    const file = await this.prisma.memberFile.findFirst({
      where: { id: fileId, deletedAt: null, status: "completed" },
    });
    if (!file || !file.mimeType.startsWith("image/")) {
      throw new NotFoundException("Không tìm thấy ảnh.");
    }
    return {
      file: this.toResponse(file),
      stream: new StreamableFile(createReadStream(this.resolveStoragePath(file.storageKey))),
    };
  }

  async previewLinkAppearanceMedia(
    slug: string,
    kind: LinkAppearanceMediaKind,
  ) {
    const link = await this.prisma.link.findFirst({
      where: { slug, status: "active", deletedAt: null },
      select: { appearanceJson: true },
    });
    if (!link) {
      throw new NotFoundException("Không tìm thấy link.");
    }

    const fileId = getLinkAppearanceMediaFileId(link.appearanceJson, kind);
    if (fileId === null) {
      throw new NotFoundException("Không tìm thấy media công khai của link.");
    }

    const file = await this.prisma.memberFile.findFirst({
      where: { id: fileId, deletedAt: null, status: "completed" },
    });
    if (
      !file ||
      (!file.mimeType.startsWith("image/") &&
        !file.mimeType.startsWith("video/"))
    ) {
      throw new NotFoundException("Không tìm thấy media công khai của link.");
    }

    return {
      file: this.toResponse(file),
      stream: new StreamableFile(
        createReadStream(this.resolveStoragePath(file.storageKey)),
      ),
    };
  }

  async downloadLinkDestination(slug: string) {
    const link = await this.prisma.link.findFirst({
      where: {
        slug,
        destinationType: "file",
        status: "active",
        deletedAt: null,
        destinationFile: { deletedAt: null, status: "completed" },
      },
      include: { destinationFile: true },
    });
    if (!link?.destinationFile) throw new NotFoundException("Không tìm thấy file destination.");
    return this.createDownload(link.destinationFile);
  }

  async forceRemoveLocalFile(path: string) {
    try { await unlink(path); } catch { /* Missing temp files do not mask the API error. */ }
  }

  private async createDownload(file: MemberFile) {
    const updated = await this.prisma.memberFile.update({
      where: { id: file.id },
      data: { downloadCount: { increment: 1 } },
    });
    return {
      file: this.toResponse(updated),
      stream: new StreamableFile(createReadStream(this.resolveStoragePath(file.storageKey))),
    };
  }

  private async assertOwned(userId: number, id: number) {
    const file = await this.prisma.memberFile.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!file) throw new NotFoundException("Không tìm thấy file.");
    return file;
  }

  private async assertAllOwned(userId: number, ids: number[]) {
    const count = await this.prisma.memberFile.count({
      where: { id: { in: ids }, userId, deletedAt: null },
    });
    if (count !== ids.length) throw new NotFoundException("Một hoặc nhiều file không tồn tại.");
  }

  private async assertNotInUse(ids: number[]) {
    const usageCount = await this.prisma.link.count({
      where: { destinationFileId: { in: ids }, deletedAt: null },
    });
    if (usageCount > 0) {
      throw new ConflictException({
        statusCode: 409,
        code: "FILE_IN_USE",
        message: "Không thể xóa file đang được dùng làm destination.",
        usageCount,
      });
    }
  }

  private assertWithinQuota(limit: bigint | null, used: bigint, reserved: bigint, incoming: bigint, defaultLimit: bigint) {
    const effectiveLimit = limit ?? defaultLimit;
    if (used + reserved + incoming > effectiveLimit) {
      throw new PayloadTooLargeException({
        statusCode: 413,
        code: "STORAGE_QUOTA_EXCEEDED",
        message: "Dung lượng lưu trữ còn lại không đủ cho file này.",
        retryable: false,
      });
    }
  }

  private orderBy(sort: "date" | "name" | "size" | "downloads", direction: "asc" | "desc") {
    const map: Record<string, Prisma.MemberFileOrderByWithRelationInput> = {
      date: { createdAt: direction }, name: { name: direction }, size: { size: direction },
      downloads: { downloadCount: direction },
    };
    return map[sort];
  }

  private typeWhere(type?: ListFilesQueryDto["type"]): Prisma.MemberFileWhereInput {
    if (!type) return {};
    if (["image", "video", "audio"].includes(type)) return { mimeType: { startsWith: `${type}/` } };
    if (type === "archive") return { OR: [
      { mimeType: { contains: "zip" } }, { mimeType: { contains: "rar" } },
      { extension: { in: ["zip", "rar", "7z", "tar", "gz"] } },
    ] };
    if (type === "document") return { OR: [
      { mimeType: { startsWith: "text/" } }, { mimeType: { contains: "pdf" } },
      { mimeType: { contains: "document" } },
      { extension: { in: ["pdf", "doc", "docx", "txt", "csv", "xlsx", "pptx"] } },
    ] };
    return { NOT: { OR: [
      { mimeType: { startsWith: "image/" } }, { mimeType: { startsWith: "video/" } },
      { mimeType: { startsWith: "audio/" } }, { mimeType: { startsWith: "text/" } },
      { mimeType: { contains: "pdf" } }, { mimeType: { contains: "document" } },
      { mimeType: { contains: "zip" } }, { mimeType: { contains: "rar" } },
    ] } };
  }

  private stateWhere(state?: ListFilesQueryDto["state"]): Prisma.MemberFileWhereInput {
    if (!state) return {};
    if (state === "ready") return { status: { in: ["completed", "ready"] } };
    if (state === "processing") return { status: { in: ["processing", "queued", "uploading"] } };
    return { status: { in: ["failed", "error"] } };
  }

  private cleanFileName(value: string) {
    return value.trim().replace(/\s+/g, " ").slice(0, 255) || "Untitled file";
  }

  private async createUniqueAlias(userId: number, source: string) {
    const baseAlias = normalizeFileAlias(source) || `file-${Date.now()}`;
    let alias = baseAlias;
    let suffix = 1;
    while (await this.prisma.memberFile.findUnique({ where: { userId_alias: { userId, alias } } })) {
      alias = `${baseAlias}-${suffix++}`;
    }
    return alias;
  }

  private parseId(id: string) {
    const parsed = this.tryParseId(id);
    if (!parsed) throw new NotFoundException("Không tìm thấy file.");
    return parsed;
  }

  private tryParseId(id: string) {
    const parsed = Number(id);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
  }

  private parseIds(ids: string[]) {
    const parsed = [...new Set(ids.map((id) => this.parseId(id)))];
    if (parsed.length !== ids.length) throw new BadRequestException("Danh sách file ID không hợp lệ.");
    return parsed;
  }

  private toStorageKey(path: string) {
    if (path.startsWith(this.uploadRoot)) {
      return `member-files/${path.slice(this.uploadRoot.length).replace(/^[/\\]+/, "").replaceAll("\\", "/")}`;
    }
    return path;
  }

  private resolveStoragePath(storageKey: string) {
    if (isAbsolute(storageKey)) return storageKey;
    if (storageKey.startsWith("member-files/")) {
      return join(dirname(this.uploadRoot), storageKey);
    }
    return resolve(process.cwd(), storageKey);
  }

  private toStorageSummary(user: { storageLimitBytes: bigint | null; storageUsedBytes: bigint; storageReservedBytes: bigint }, defaultLimit: bigint) {
    return {
      usedBytes: Number(user.storageUsedBytes),
      reservedBytes: Number(user.storageReservedBytes),
      limitBytes: Number(user.storageLimitBytes ?? defaultLimit),
    };
  }

  private toResponse(file: FileWithUsage) {
    return {
      id: String(file.id), alias: file.alias, name: file.name,
      originalName: file.originalName, extension: file.extension, mimeType: file.mimeType,
      size: file.size, sizeLabel: this.formatBytes(file.size), purpose: file.purpose,
      downloadCount: file.downloadCount, status: file.status,
      usageCount: file._count?.destinationLinks ?? 0,
      createdAt: file.createdAt, updatedAt: file.updatedAt, deletedAt: file.deletedAt,
    };
  }

  private formatBytes(size: number) {
    if (size === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const unit = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
    const value = size / 1024 ** unit;
    return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 2)} ${units[unit]}`;
  }
}
