import {
  Injectable,
  NotFoundException,
  StreamableFile,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma, type ManagedFile } from "@prisma/client";
import { createReadStream } from "node:fs";
import { mkdir, unlink } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { randomBytes } from "node:crypto";

import { PrismaService } from "../../database/prisma/prisma.service";
import { UpdateFileDto } from "./dto/update-file.dto";

export type UploadedDiskFile = {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
};

export function normalizeFileAlias(value: string): string {
  const map: Record<string, string> = {
    đ: "d",
    Đ: "D",
    æ: "ae",
    Æ: "AE",
    œ: "oe",
    Œ: "OE",
    ø: "o",
    Ø: "O",
    ł: "l",
    Ł: "L",
    ß: "ss",
    ẞ: "SS",
    ð: "d",
    Ð: "D",
    þ: "th",
    Þ: "TH",
  };

  return value
    // Chỉ lấy tên file, bỏ đường dẫn.
    .split(/[\\/]/u)
    .pop()!
    .trim()

    // Bỏ extension cuối cùng, nhưng giữ dotfile như .env.
    .replace(/(?<!^)\.[^\s./\\]+$/u, "")

    // Thay các ký tự đặc biệt không được normalize đầy đủ.
    .replace(
      /[đĐæÆœŒøØłŁßẞðÐþÞ]/gu,
      (character) => map[character] ?? character,
    )

    // Chuẩn hóa Unicode và loại bỏ dấu tiếng Việt/Latin.
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")

    // Chuyển chữ thường.
    .toLocaleLowerCase("vi-VN")

    // Giữ chữ và số của mọi ngôn ngữ.
    .replace(/[^\p{L}\p{N}]+/gu, "-")

    // Gộp dấu gạch ngang.
    .replace(/-+/g, "-")

    // Bỏ dấu gạch ngang đầu/cuối.
    .replace(/^-+|-+$/g, "");
}

export function buildStoredFileName(originalName: string) {
  const extension = extname(originalName);
  const base = normalizeFileAlias(basename(originalName, extension)).slice(0, 64);

  return `${base || "file"}-${randomBytes(8).toString("hex")}${extension}`;
}

type FileSort = "date" | "name" | "size" | "downloads";
type SortDirection = "asc" | "desc";

@Injectable()
export class FilesService {
  private readonly uploadRoot: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.uploadRoot =
      this.configService.get<string>("UPLOAD_DIR") ||
      join(process.cwd(), "uploads", "files");
  }

  async ensureUploadRoot() {
    await mkdir(this.uploadRoot, { recursive: true });
    return this.uploadRoot;
  }

  async create(uploadedFile: UploadedDiskFile) {
    const extension = extname(uploadedFile.originalname).replace(".", "");
    const name = this.cleanFileName(uploadedFile.originalname);
    const alias = await this.createUniqueAlias(name);

    const file = await this.prisma.managedFile.create({
      data: {
        alias,
        name,
        originalName: uploadedFile.originalname,
        extension: extension || null,
        mimeType: uploadedFile.mimetype,
        size: uploadedFile.size,
        path: uploadedFile.path,
      },
    });

    return this.toResponse(file);
  }

  async findAll(query: {
    q?: string;
    sort?: FileSort;
    direction?: SortDirection;
    status?: "active" | "trash";
  }) {
    const sort = query.sort || "date";
    const direction = query.direction || "desc";
    const where: Prisma.ManagedFileWhereInput = {
      deletedAt: query.status === "trash" ? { not: null } : null,
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

    const files = await this.prisma.managedFile.findMany({
      where,
      orderBy: this.orderBy(sort, direction),
    });

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    return {
      items: files.map((file) => this.toResponse(file)),
      total: files.length,
      totalSize,
    };
  }

  async findOne(idOrAlias: string) {
    const file = await this.prisma.managedFile.findFirst({
      where: {
        OR: [{ id: idOrAlias }, { alias: idOrAlias }],
        deletedAt: null,
      },
    });

    if (!file) {
      throw new NotFoundException("Không tìm thấy file.");
    }

    return file;
  }

  async update(id: string, updateFileDto: UpdateFileDto) {
    await this.findOne(id);

    const file = await this.prisma.managedFile.update({
      where: { id },
      data: {
        name: updateFileDto.name?.trim() || undefined,
        isPublic: updateFileDto.isPublic,
      },
    });

    return this.toResponse(file);
  }

  async remove(id: string) {
    await this.findOne(id);

    const file = await this.prisma.managedFile.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return this.toResponse(file);
  }

  async download(idOrAlias: string) {
    const file = await this.findOne(idOrAlias);

    const updatedFile = await this.prisma.managedFile.update({
      where: { id: file.id },
      data: {
        downloadCount: {
          increment: 1,
        },
      },
    });

    return {
      file: this.toResponse(updatedFile),
      stream: new StreamableFile(createReadStream(file.path)),
    };
  }

  async forceRemoveLocalFile(path: string) {
    try {
      await unlink(path);
    } catch {
      // Upload metadata is the source of truth; a missing temp file should not mask API errors.
    }
  }

  private orderBy(sort: FileSort, direction: SortDirection) {
    const orderMap: Record<FileSort, Prisma.ManagedFileOrderByWithRelationInput> =
      {
        date: { createdAt: direction },
        name: { name: direction },
        size: { size: direction },
        downloads: { downloadCount: direction },
      };

    return orderMap[sort];
  }

  private cleanFileName(value: string) {
    return value.trim().replace(/\s+/g, " ").slice(0, 255) || "Untitled file";
  }

  private async createUniqueAlias(source: string) {
    const baseAlias = this.slugify(source) || `file-${Date.now()}`;
    let alias = baseAlias;
    let suffix = 1;

    while (await this.prisma.managedFile.findUnique({ where: { alias } })) {
      alias = `${baseAlias}-${suffix}`;
      suffix += 1;
    }

    return alias;
  }

  private slugify(value: string) {
    return normalizeFileAlias(value);
  }

  private toResponse(file: ManagedFile) {
    return {
      id: file.id,
      alias: file.alias,
      name: file.name,
      originalName: file.originalName,
      extension: file.extension,
      mimeType: file.mimeType,
      size: file.size,
      sizeLabel: this.formatBytes(file.size),
      isPublic: file.isPublic,
      downloadCount: file.downloadCount,
      status: file.status,
      downloadUrl: `/api/backend/files/${file.id}/download`,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      deletedAt: file.deletedAt,
    };
  }

  private formatBytes(size: number) {
    if (size === 0) {
      return "0 B";
    }

    const units = ["B", "KB", "MB", "GB", "TB"];
    const unit = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
    const value = size / 1024 ** unit;

    return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 2)} ${units[unit]}`;
  }
}
