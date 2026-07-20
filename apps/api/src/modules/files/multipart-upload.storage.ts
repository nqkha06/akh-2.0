import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, open, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { buildStoredFileName, type UploadedDiskFile } from "./files.service";

export const MULTIPART_UPLOAD_STORAGE = Symbol("MULTIPART_UPLOAD_STORAGE");
export const MULTIPART_PART_SIZE = 5 * 1024 * 1024;

const MULTIPART_UPLOAD_TTL_MS = 24 * 60 * 60 * 1000;

export type MultipartUploadPurpose = "file" | "cover";

export type MultipartUploadMetadata = {
  version: 1;
  uploadId: string;
  originalName: string;
  mimeType: string;
  size: number;
  purpose: MultipartUploadPurpose;
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
  initiate(input: InitiateMultipartUploadInput): Promise<{
    uploadId: string;
    partSize: number;
    totalParts: number;
    expiresAt: string;
  }>;
  uploadPart(uploadId: string, partNumber: number, chunk: Buffer): Promise<{
    uploadId: string;
    partNumber: number;
    receivedBytes: number;
  }>;
  complete(uploadId: string): Promise<UploadedDiskFile>;
  abort(uploadId: string): Promise<void>;
}

@Injectable()
export class LocalMultipartUploadStorage implements MultipartUploadStorage {
  private readonly uploadRoot: string;
  private readonly multipartRoot: string;

  constructor(configService: ConfigService) {
    this.uploadRoot = resolve(
      configService.get<string>("UPLOAD_DIR") || join(process.cwd(), "uploads", "files"),
    );
    this.multipartRoot = join(this.uploadRoot, ".multipart");
  }

  async initiate(input: InitiateMultipartUploadInput) {
    await this.cleanupExpiredUploads();

    const uploadId = randomUUID();
    const metadata: MultipartUploadMetadata = {
      version: 1,
      uploadId,
      originalName: this.cleanOriginalName(input.fileName),
      mimeType: input.mimeType.trim().slice(0, 255) || "application/octet-stream",
      size: input.size,
      purpose: input.purpose || "file",
      storedFileName: buildStoredFileName(input.fileName),
      partSize: MULTIPART_PART_SIZE,
      totalParts: Math.ceil(input.size / MULTIPART_PART_SIZE),
      createdAt: new Date().toISOString(),
    };

    const uploadDirectory = this.getUploadDirectory(uploadId);
    await mkdir(uploadDirectory, { recursive: false });
    await writeFile(this.getMetadataPath(uploadId), JSON.stringify(metadata), { encoding: "utf8", flag: "wx" });

    return {
      uploadId,
      partSize: metadata.partSize,
      totalParts: metadata.totalParts,
      expiresAt: new Date(Date.now() + MULTIPART_UPLOAD_TTL_MS).toISOString(),
    };
  }

  async uploadPart(uploadId: string, partNumber: number, chunk: Buffer) {
    const metadata = await this.readMetadata(uploadId);
    this.assertPartNumber(metadata, partNumber);

    const expectedSize = this.getExpectedPartSize(metadata, partNumber);
    if (chunk.length !== expectedSize) {
      throw new BadRequestException(
        `Part ${partNumber} không đúng kích thước. Đã nhận ${chunk.length} byte, cần ${expectedSize} byte.`,
      );
    }

    const temporaryPath = join(this.getUploadDirectory(uploadId), `part-${partNumber}.tmp`);
    const partPath = this.getPartPath(uploadId, partNumber);
    await writeFile(temporaryPath, chunk, { flag: "w" });
    await rename(temporaryPath, partPath);

    return { uploadId, partNumber, receivedBytes: chunk.length };
  }

  async complete(uploadId: string) {
    const metadata = await this.readMetadata(uploadId);
    await this.assertAllPartsUploaded(metadata);
    await mkdir(this.uploadRoot, { recursive: true });

    const finalPath = join(this.uploadRoot, metadata.storedFileName);
    const fileHandle = await open(finalPath, "wx");

    try {
      for (let partNumber = 1; partNumber <= metadata.totalParts; partNumber += 1) {
        const stream = createReadStream(this.getPartPath(uploadId, partNumber));
        for await (const chunk of stream) {
          await fileHandle.write(chunk as Buffer);
        }
      }
    } catch (error) {
      await fileHandle.close();
      await rm(finalPath, { force: true });
      throw error;
    }

    await fileHandle.close();
    const completedFile = await stat(finalPath);
    if (completedFile.size !== metadata.size) {
      await rm(finalPath, { force: true });
      throw new BadRequestException("File sau khi ghép part không đúng kích thước.");
    }

    await rm(this.getUploadDirectory(uploadId), { recursive: true, force: true });

    return {
      filename: metadata.storedFileName,
      originalname: metadata.originalName,
      mimetype: metadata.mimeType,
      size: metadata.size,
      path: finalPath,
    };
  }

  async abort(uploadId: string) {
    await this.assertUploadExists(uploadId);
    await rm(this.getUploadDirectory(uploadId), { recursive: true, force: true });
  }

  private async readMetadata(uploadId: string) {
    await this.assertUploadExists(uploadId);

    try {
      const value = await readFile(this.getMetadataPath(uploadId), "utf8");
      return JSON.parse(value) as MultipartUploadMetadata;
    } catch {
      throw new NotFoundException("Phiên upload không tồn tại hoặc đã hết hạn.");
    }
  }

  private async assertUploadExists(uploadId: string) {
    if (!/^[0-9a-f-]{36}$/i.test(uploadId)) {
      throw new NotFoundException("Phiên upload không tồn tại.");
    }

    try {
      await stat(this.getUploadDirectory(uploadId));
    } catch {
      throw new NotFoundException("Phiên upload không tồn tại hoặc đã hết hạn.");
    }
  }

  private assertPartNumber(metadata: MultipartUploadMetadata, partNumber: number) {
    if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > metadata.totalParts) {
      throw new BadRequestException(`Part number phải nằm trong khoảng 1-${metadata.totalParts}.`);
    }
  }

  private async assertAllPartsUploaded(metadata: MultipartUploadMetadata) {
    for (let partNumber = 1; partNumber <= metadata.totalParts; partNumber += 1) {
      try {
        const part = await stat(this.getPartPath(metadata.uploadId, partNumber));
        if (part.size !== this.getExpectedPartSize(metadata, partNumber)) {
          throw new Error("invalid-part-size");
        }
      } catch {
        throw new BadRequestException(`Part ${partNumber} chưa được upload đầy đủ.`);
      }
    }
  }

  private getExpectedPartSize(metadata: MultipartUploadMetadata, partNumber: number) {
    if (partNumber < metadata.totalParts) return metadata.partSize;
    return metadata.size - metadata.partSize * (metadata.totalParts - 1);
  }

  private getUploadDirectory(uploadId: string) {
    return join(this.multipartRoot, uploadId);
  }

  private getMetadataPath(uploadId: string) {
    return join(this.getUploadDirectory(uploadId), "metadata.json");
  }

  private getPartPath(uploadId: string, partNumber: number) {
    return join(this.getUploadDirectory(uploadId), `part-${partNumber}`);
  }

  private cleanOriginalName(value: string) {
    const cleaned = value.replace(/[\\/\0]/g, "_").trim().slice(0, 255);
    return cleaned || "file";
  }

  private async cleanupExpiredUploads() {
    await mkdir(this.multipartRoot, { recursive: true });

    const entries = await readdir(this.multipartRoot, { withFileTypes: true });
    const cutoff = Date.now() - MULTIPART_UPLOAD_TTL_MS;

    await Promise.all(entries.filter((entry) => entry.isDirectory()).map(async (entry) => {
      const directory = join(this.multipartRoot, entry.name);
      try {
        const metadata = JSON.parse(await readFile(join(directory, "metadata.json"), "utf8")) as MultipartUploadMetadata;
        if (new Date(metadata.createdAt).getTime() < cutoff) {
          await rm(directory, { recursive: true, force: true });
        }
      } catch {
        try {
          const directoryStats = await stat(directory);
          if (directoryStats.mtimeMs < cutoff) {
            await rm(directory, { recursive: true, force: true });
          }
        } catch {
          // The directory may have been removed by another cleanup request.
        }
      }
    }));
  }
}
