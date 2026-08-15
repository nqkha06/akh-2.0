import { BadRequestException } from "@nestjs/common";

export function normalizeReportedUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Unsupported protocol");
    }
    return url.toString();
  } catch {
    throw new BadRequestException("URL cần báo cáo không hợp lệ.");
  }
}
