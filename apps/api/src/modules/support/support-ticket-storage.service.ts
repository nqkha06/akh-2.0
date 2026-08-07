import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { BusinessSettingsService } from "../business-settings/business-settings.service";

const ALLOWED_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "pdf",
  "txt",
  "log",
]);

type ValidatedAttachment = {
  extension: string;
  mimeType: string;
};

@Injectable()
export class SupportTicketStorageService {
  private readonly storageRoot: string;

  constructor(
    config: ConfigService,
    private readonly businessSettings: BusinessSettingsService,
  ) {
    this.storageRoot =
      config.get<string>("SUPPORT_TICKETS_UPLOAD_DIR") ||
      join(process.cwd(), "uploads");
  }

  async validate(file: Express.Multer.File): Promise<ValidatedAttachment> {
    if (!file.buffer?.length) {
      throw new BadRequestException("Tệp đính kèm không hợp lệ.");
    }
    const settings = await this.businessSettings.getRuntime();
    if (file.size > settings.supportAttachmentMaxBytes) {
      throw new BadRequestException(
        `Mỗi tệp đính kèm tối đa ${Math.round(settings.supportAttachmentMaxBytes / 1024 / 1024)} MB.`,
      );
    }

    const extension = extname(file.originalname).slice(1).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      throw new BadRequestException(
        "Chỉ hỗ trợ PNG, JPG, WEBP, PDF, TXT và LOG.",
      );
    }

    const mimeType = this.detectMime(file.buffer, extension);
    if (!mimeType) {
      throw new BadRequestException(
        `Không thể xác thực định dạng tệp ${file.originalname}.`,
      );
    }
    if (!settings.uploadAllowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException(
        "Loại tệp đính kèm này chưa được quản trị viên cho phép.",
      );
    }
    return { extension, mimeType };
  }

  buildStorageKey(userId: number, extension: string) {
    const now = new Date();
    return [
      "support-tickets",
      String(userId),
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

  read(storageKey: string) {
    return readFile(this.resolve(storageKey));
  }

  async remove(storageKey: string) {
    try {
      await unlink(this.resolve(storageKey));
    } catch {
      // Database remains authoritative if an attachment is already missing.
    }
  }

  private resolve(storageKey: string) {
    const safeKey = normalize(storageKey).replace(/^(\.\.(\/|\\|$))+/, "");
    return join(this.storageRoot, safeKey);
  }

  private detectMime(buffer: Buffer, extension: string) {
    if (
      extension === "png" &&
      buffer.length >= 8 &&
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ) {
      return "image/png";
    }
    if (
      (extension === "jpg" || extension === "jpeg") &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8
    ) {
      return "image/jpeg";
    }
    if (
      extension === "webp" &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    ) {
      return "image/webp";
    }
    if (extension === "pdf" && buffer.toString("ascii", 0, 5) === "%PDF-") {
      return "application/pdf";
    }
    if (
      (extension === "txt" || extension === "log") &&
      !buffer.subarray(0, 4096).includes(0)
    ) {
      return "text/plain";
    }
    return null;
  }
}
