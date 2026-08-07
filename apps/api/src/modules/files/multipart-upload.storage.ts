import { BadRequestException, Injectable, NotFoundException, PayloadTooLargeException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, open, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { PrismaService } from "../../database/prisma/prisma.service";
import { BusinessSettingsService } from "../business-settings/business-settings.service";
import { buildStoredFileName, type UploadedDiskFile } from "./files.service";

export const MULTIPART_UPLOAD_STORAGE = Symbol("MULTIPART_UPLOAD_STORAGE");
export const MULTIPART_PART_SIZE = 5 * 1024 * 1024;
const MULTIPART_UPLOAD_TTL_MS = 24 * 60 * 60 * 1000;

export type MultipartUploadPurpose = "file" | "cover";

type MultipartUploadMetadata = {
  version: 2;
  uploadId: string;
  userId: number;
  originalName: string;
  mimeType: string;
  size: number;
  purpose: MultipartUploadPurpose;
  storageKey: string;
  storedFileName: string;
  partSize: number;
  totalParts: number;
  createdAt: string;
};

export type InitiateMultipartUploadInput = {
  fileName: string;
  mimeType: string;
  size: number;
  purpose?: MultipartUploadPurpose;
};

export interface MultipartUploadStorage {
  initiate(userId: number, input: InitiateMultipartUploadInput): Promise<{
    uploadId: string; partSize: number; totalParts: number; expiresAt: string;
  }>;
  uploadPart(userId: number, uploadId: string, partNumber: number, chunk: Buffer): Promise<{
    uploadId: string; partNumber: number; receivedBytes: number;
  }>;
  complete(userId: number, uploadId: string): Promise<UploadedDiskFile>;
  abort(userId: number, uploadId: string): Promise<void>;
}

@Injectable()
export class LocalMultipartUploadStorage implements MultipartUploadStorage {
  private readonly uploadRoot: string;
  private readonly multipartRoot: string;

  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
    private readonly businessSettings: BusinessSettingsService,
  ) {
    this.uploadRoot = resolve(
      configService.get<string>("MEMBER_FILES_UPLOAD_DIR") ||
        join(process.cwd(), "uploads", "member-files"),
    );
    this.multipartRoot = join(this.uploadRoot, ".multipart");
  }

  async initiate(userId: number, input: InitiateMultipartUploadInput) {
    const settings = await this.businessSettings.getRuntime();
    await this.cleanupExpiredUploads();
    const uploadId = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + MULTIPART_UPLOAD_TTL_MS);
    const storedFileName = buildStoredFileName(input.fileName);
    const year = String(now.getUTCFullYear());
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const storageKey = `member-files/${userId}/${year}/${month}/${storedFileName}`;
    const metadata: MultipartUploadMetadata = {
      version: 2,
      uploadId,
      userId,
      originalName: this.cleanOriginalName(input.fileName),
      mimeType: input.mimeType.trim().slice(0, 255) || "application/octet-stream",
      size: input.size,
      purpose: input.purpose || "file",
      storageKey,
      storedFileName,
      partSize: MULTIPART_PART_SIZE,
      totalParts: Math.ceil(input.size / MULTIPART_PART_SIZE),
      createdAt: now.toISOString(),
    };

    await this.prisma.$transaction(async (prisma) => {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException("Không tìm thấy tài khoản.");
      const limit = user.storageLimitBytes ?? BigInt(settings.memberStorageQuotaBytes);
      const incoming = BigInt(input.size);
      if (user.storageUsedBytes + user.storageReservedBytes + incoming > limit) {
        throw new PayloadTooLargeException({
          statusCode: 413,
          code: "STORAGE_QUOTA_EXCEEDED",
          message: "Dung lượng lưu trữ còn lại không đủ cho file này.",
          retryable: false,
        });
      }
      await prisma.memberFileUpload.create({
        data: {
          id: uploadId, userId, originalName: metadata.originalName,
          mimeType: metadata.mimeType, size: input.size, purpose: metadata.purpose,
          storageKey, expiresAt,
        },
      });
      await prisma.user.update({
        where: { id: userId },
        data: { storageReservedBytes: { increment: incoming } },
      });
    });

    try {
      const uploadDirectory = this.getUploadDirectory(uploadId);
      await mkdir(uploadDirectory, { recursive: false });
      await writeFile(this.getMetadataPath(uploadId), JSON.stringify(metadata), { encoding: "utf8", flag: "wx" });
    } catch (error) {
      await this.releaseReservation(userId, uploadId);
      throw error;
    }

    return { uploadId, partSize: metadata.partSize, totalParts: metadata.totalParts, expiresAt: expiresAt.toISOString() };
  }

  async uploadPart(userId: number, uploadId: string, partNumber: number, chunk: Buffer) {
    const metadata = await this.readMetadata(userId, uploadId);
    this.assertPartNumber(metadata, partNumber);
    const expectedSize = this.getExpectedPartSize(metadata, partNumber);
    if (chunk.length !== expectedSize) {
      throw new BadRequestException(`Part ${partNumber} không đúng kích thước. Đã nhận ${chunk.length} byte, cần ${expectedSize} byte.`);
    }
    const temporaryPath = join(this.getUploadDirectory(uploadId), `part-${partNumber}.tmp`);
    await writeFile(temporaryPath, chunk, { flag: "w" });
    await rename(temporaryPath, this.getPartPath(uploadId, partNumber));
    return { uploadId, partNumber, receivedBytes: chunk.length };
  }

  async complete(userId: number, uploadId: string) {
    const metadata = await this.readMetadata(userId, uploadId);
    await this.assertAllPartsUploaded(metadata);
    const finalPath = this.getFinalPath(metadata.storageKey);
    await mkdir(resolve(finalPath, ".."), { recursive: true });
    const fileHandle = await open(finalPath, "wx");
    try {
      for (let partNumber = 1; partNumber <= metadata.totalParts; partNumber += 1) {
        for await (const chunk of createReadStream(this.getPartPath(uploadId, partNumber))) {
          await fileHandle.write(chunk as Buffer);
        }
      }
    } catch (error) {
      await fileHandle.close();
      await rm(finalPath, { force: true });
      throw error;
    }
    await fileHandle.close();
    if ((await stat(finalPath)).size !== metadata.size) {
      await rm(finalPath, { force: true });
      throw new BadRequestException("File sau khi ghép part không đúng kích thước.");
    }
    await rm(this.getUploadDirectory(uploadId), { recursive: true, force: true });
    await this.prisma.memberFileUpload.update({ where: { id: uploadId }, data: { status: "completed" } });
    return {
      filename: metadata.storedFileName,
      originalname: metadata.originalName,
      mimetype: metadata.mimeType,
      size: metadata.size,
      path: finalPath,
      storageKey: metadata.storageKey,
      purpose: metadata.purpose,
    };
  }

  async abort(userId: number, uploadId: string) {
    const upload = await this.prisma.memberFileUpload.findFirst({ where: { id: uploadId, userId } });
    if (!upload) throw new NotFoundException("Phiên upload không tồn tại hoặc đã hết hạn.");
    await rm(this.getUploadDirectory(uploadId), { recursive: true, force: true });
    if (upload.status === "completed") await rm(this.getFinalPath(upload.storageKey), { force: true });
    await this.releaseReservation(userId, uploadId);
  }

  private async readMetadata(userId: number, uploadId: string) {
    this.assertUploadId(uploadId);
    const upload = await this.prisma.memberFileUpload.findFirst({ where: { id: uploadId, userId } });
    if (!upload) throw new NotFoundException("Phiên upload không tồn tại hoặc đã hết hạn.");
    try {
      const metadata = JSON.parse(await readFile(this.getMetadataPath(uploadId), "utf8")) as MultipartUploadMetadata;
      if (metadata.version !== 2 || metadata.userId !== userId) throw new Error("invalid-owner");
      return metadata;
    } catch {
      throw new NotFoundException("Phiên upload không tồn tại hoặc đã hết hạn.");
    }
  }

  private assertUploadId(uploadId: string) {
    if (!/^[0-9a-f-]{36}$/i.test(uploadId)) throw new NotFoundException("Phiên upload không tồn tại.");
  }

  private assertPartNumber(metadata: MultipartUploadMetadata, partNumber: number) {
    if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > metadata.totalParts) {
      throw new BadRequestException(`Part number phải nằm trong khoảng 1-${metadata.totalParts}.`);
    }
  }

  private async assertAllPartsUploaded(metadata: MultipartUploadMetadata) {
    for (let partNumber = 1; partNumber <= metadata.totalParts; partNumber += 1) {
      try {
        if ((await stat(this.getPartPath(metadata.uploadId, partNumber))).size !== this.getExpectedPartSize(metadata, partNumber)) throw new Error();
      } catch {
        throw new BadRequestException(`Part ${partNumber} chưa được upload đầy đủ.`);
      }
    }
  }

  private getExpectedPartSize(metadata: MultipartUploadMetadata, partNumber: number) {
    return partNumber < metadata.totalParts
      ? metadata.partSize
      : metadata.size - metadata.partSize * (metadata.totalParts - 1);
  }

  private getUploadDirectory(uploadId: string) { return join(this.multipartRoot, uploadId); }
  private getMetadataPath(uploadId: string) { return join(this.getUploadDirectory(uploadId), "metadata.json"); }
  private getPartPath(uploadId: string, partNumber: number) { return join(this.getUploadDirectory(uploadId), `part-${partNumber}`); }
  private getFinalPath(storageKey: string) { return join(resolve(this.uploadRoot, ".."), storageKey); }

  private cleanOriginalName(value: string) {
    return value.replace(/[\\/\0]/g, "_").trim().slice(0, 255) || "file";
  }

  private async releaseReservation(userId: number, uploadId: string) {
    await this.prisma.$transaction(async (prisma) => {
      const upload = await prisma.memberFileUpload.findFirst({ where: { id: uploadId, userId } });
      if (!upload) return;
      await prisma.memberFileUpload.delete({ where: { id: uploadId } });
      await prisma.user.update({
        where: { id: userId },
        data: { storageReservedBytes: { decrement: BigInt(upload.size) } },
      });
    });
  }

  private async cleanupExpiredUploads() {
    await mkdir(this.multipartRoot, { recursive: true });
    const expired = await this.prisma.memberFileUpload.findMany({ where: { expiresAt: { lt: new Date() } } });
    for (const upload of expired) {
      await rm(this.getUploadDirectory(upload.id), { recursive: true, force: true });
      if (upload.status === "completed") await rm(this.getFinalPath(upload.storageKey), { force: true });
      await this.releaseReservation(upload.userId, upload.id);
    }

    const known = new Set((await this.prisma.memberFileUpload.findMany({ select: { id: true } })).map((upload) => upload.id));
    const entries = await readdir(this.multipartRoot, { withFileTypes: true });
    await Promise.all(entries.filter((entry) => entry.isDirectory() && !known.has(entry.name)).map((entry) =>
      rm(join(this.multipartRoot, entry.name), { recursive: true, force: true }),
    ));
  }

}
