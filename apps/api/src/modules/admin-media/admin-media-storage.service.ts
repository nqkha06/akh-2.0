import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { BusinessSettingsService } from "../business-settings/business-settings.service";

const MIME_BY_EXTENSION: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  ico: "image/x-icon",
};

type ValidatedImage = {
  extension: string;
  mimeType: string;
  width: number | null;
  height: number | null;
};

@Injectable()
export class AdminMediaStorageService {
  private readonly storageRoot: string;

  constructor(
    config: ConfigService,
    private readonly businessSettings: BusinessSettingsService,
  ) {
    this.storageRoot =
      config.get<string>("ADMIN_MEDIA_UPLOAD_DIR") ||
      join(process.cwd(), "uploads");
  }

  async validateImage(file: Express.Multer.File): Promise<ValidatedImage> {
    if (!file.buffer?.length) {
      throw new BadRequestException({
        code: "INVALID_MEDIA_FILE",
        message: "File tải lên không hợp lệ.",
      });
    }
    const settings = await this.businessSettings.getRuntime();
    if (file.size > settings.adminMediaMaxBytes) {
      throw new BadRequestException({
        code: "MEDIA_FILE_TOO_LARGE",
        message: `Ảnh Admin Media tối đa ${Math.round(settings.adminMediaMaxBytes / 1024 / 1024)} MB.`,
      });
    }

    const extension = extname(file.originalname).slice(1).toLowerCase();
    const expectedMime = MIME_BY_EXTENSION[extension];
    const detectedMime = this.detectMime(file.buffer);
    if (!expectedMime || !detectedMime || expectedMime !== detectedMime) {
      throw new BadRequestException({
        code: "UNSUPPORTED_MEDIA_TYPE",
        message: "Chỉ hỗ trợ PNG, JPG/JPEG, WEBP và ICO hợp lệ.",
      });
    }

    const dimensions = this.readDimensions(file.buffer, detectedMime);
    return {
      extension,
      mimeType: detectedMime,
      width: dimensions?.width ?? null,
      height: dimensions?.height ?? null,
    };
  }

  buildStorageKey(folderId: string | null, extension: string) {
    const now = new Date();
    return [
      "admin-media",
      folderId || "root",
      String(now.getUTCFullYear()),
      String(now.getUTCMonth() + 1).padStart(2, "0"),
      `${randomUUID()}.${extension}`,
    ].join("/");
  }

  async write(storageKey: string, buffer: Buffer) {
    const path = this.resolve(storageKey);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, buffer, { flag: "wx" });
  }

  async read(storageKey: string) {
    return readFile(this.resolve(storageKey));
  }

  async remove(storageKey: string) {
    try {
      await unlink(this.resolve(storageKey));
    } catch {
      // Database soft-delete remains authoritative when a physical file is missing.
    }
  }

  private resolve(storageKey: string) {
    const safeKey = normalize(storageKey).replace(/^(\.\.(\/|\\|$))+/, "");
    return join(this.storageRoot, safeKey);
  }

  private detectMime(buffer: Buffer): string | null {
    if (
      buffer.length >= 24 &&
      buffer.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      )
    ) {
      return "image/png";
    }
    if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
      return "image/jpeg";
    }
    if (
      buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    ) {
      return "image/webp";
    }
    if (
      buffer.length >= 8 &&
      buffer[0] === 0 &&
      buffer[1] === 0 &&
      buffer[2] === 1 &&
      buffer[3] === 0
    ) {
      return "image/x-icon";
    }
    return null;
  }

  private readDimensions(buffer: Buffer, mimeType: string) {
    if (mimeType === "image/png" && buffer.length >= 24) {
      return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
    }
    if (mimeType === "image/x-icon" && buffer.length >= 8) {
      return {
        width: buffer[6] || 256,
        height: buffer[7] || 256,
      };
    }
    if (mimeType === "image/webp" && buffer.length >= 30) {
      const kind = buffer.toString("ascii", 12, 16);
      if (kind === "VP8X") {
        return {
          width: 1 + buffer.readUIntLE(24, 3),
          height: 1 + buffer.readUIntLE(27, 3),
        };
      }
    }
    if (mimeType === "image/jpeg") {
      let offset = 2;
      while (offset + 9 < buffer.length) {
        if (buffer[offset] !== 0xff) {
          offset += 1;
          continue;
        }
        const marker = buffer[offset + 1];
        const length = buffer.readUInt16BE(offset + 2);
        if (marker && marker >= 0xc0 && marker <= 0xc3) {
          return {
            height: buffer.readUInt16BE(offset + 5),
            width: buffer.readUInt16BE(offset + 7),
          };
        }
        if (length < 2) break;
        offset += length + 2;
      }
    }
    return null;
  }
}
