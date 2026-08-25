import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

import { BusinessSettingsService } from "../business-settings/business-settings.service";

const MIME_BY_EXTENSION: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

@Injectable()
export class ProfileAvatarStorageService {
  private readonly storageRoot: string;

  constructor(
    config: ConfigService,
    private readonly businessSettings: BusinessSettingsService,
  ) {
    this.storageRoot =
      config.get<string>("PROFILE_AVATAR_UPLOAD_DIR") ||
      join(process.cwd(), "uploads", "profile-avatars");
  }

  async validate(file: Express.Multer.File) {
    if (!file.buffer?.length) {
      throw new BadRequestException("Ảnh đại diện không hợp lệ.");
    }

    const settings = await this.businessSettings.getRuntime();
    if (file.size > settings.coverImageMaxBytes) {
      throw new BadRequestException(
        `Ảnh đại diện tối đa ${Math.round(settings.coverImageMaxBytes / 1024 / 1024)} MB.`,
      );
    }

    const extension = extname(file.originalname).slice(1).toLowerCase();
    const expectedMime = MIME_BY_EXTENSION[extension];
    const detectedMime = this.detectMime(file.buffer);
    if (
      !expectedMime ||
      !detectedMime ||
      expectedMime !== detectedMime ||
      !settings.uploadAllowedMimeTypes.includes(detectedMime)
    ) {
      throw new BadRequestException(
        "Chỉ hỗ trợ ảnh PNG, JPG/JPEG hoặc WEBP hợp lệ.",
      );
    }

    return { extension, mimeType: detectedMime };
  }

  buildStorageKey(userId: number, extension: string) {
    return `${userId}/${randomUUID()}.${extension}`;
  }

  publicUrl(storageKey: string) {
    return `/api/backend/auth/profile-avatars/${storageKey}`;
  }

  async write(storageKey: string, buffer: Buffer) {
    const path = this.resolve(storageKey);
    await mkdir(join(this.storageRoot, storageKey.split("/")[0]), {
      recursive: true,
    });
    await writeFile(path, buffer, { flag: "wx" });
  }

  async read(userId: number, fileName: string) {
    if (!/^[a-f0-9-]+\.(png|jpe?g|webp)$/i.test(fileName)) {
      throw new NotFoundException("Không tìm thấy ảnh đại diện.");
    }
    const storageKey = `${userId}/${fileName}`;
    try {
      const buffer = await readFile(this.resolve(storageKey));
      const extension = extname(fileName).slice(1).toLowerCase();
      return {
        buffer,
        mimeType: MIME_BY_EXTENSION[extension] || "application/octet-stream",
      };
    } catch {
      throw new NotFoundException("Không tìm thấy ảnh đại diện.");
    }
  }

  async removeByPublicUrl(value: string | null) {
    const prefix = "/api/backend/auth/profile-avatars/";
    if (!value?.startsWith(prefix)) return;
    const storageKey = value.slice(prefix.length);
    try {
      await unlink(this.resolve(storageKey));
    } catch {
      // The database value remains authoritative if the old file is missing.
    }
  }

  private resolve(storageKey: string) {
    const safeKey = normalize(storageKey).replace(/^(\.\.(\/|\\|$))+/, "");
    return join(this.storageRoot, safeKey);
  }

  private detectMime(buffer: Buffer) {
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
    return null;
  }
}
