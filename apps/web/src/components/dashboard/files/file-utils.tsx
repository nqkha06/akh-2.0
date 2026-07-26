import type { ManagedFileDto } from "@/lib/api-client";

import type { FileTypeFilter } from "./types";

export { FileTypeIcon } from "@/components/file-type-icon";

export const FILE_SIZE_LIMIT = 100 * 1024 * 1024;

export function formatBytes(size: number) {
  if (size === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const unit = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** unit;
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 2)} ${units[unit]}`;
}

export function formatFileDate(value: string, includeTime = false) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(value));
}

export function getFileType(file: Pick<ManagedFileDto, "mimeType" | "extension">): Exclude<FileTypeFilter, "all"> {
  const mime = file.mimeType.toLowerCase();
  const extension = file.extension?.toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.includes("zip") || mime.includes("rar") || mime.includes("7z") || ["zip", "rar", "7z", "tar", "gz"].includes(extension ?? "")) return "archive";
  if (mime.includes("pdf") || mime.startsWith("text/") || mime.includes("document") || ["pdf", "doc", "docx", "txt", "csv", "xlsx", "pptx"].includes(extension ?? "")) return "document";
  return "other";
}
