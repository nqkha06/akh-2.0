import {
  Archive,
  CircleCheck,
  CircleX,
  FileArchive,
  FileAudio,
  FileIcon,
  FileImage,
  FileText,
  FileVideo,
  LoaderCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ManagedFileDto } from "@/lib/api-client";

import type { FileTypeFilter } from "./types";

export const STORAGE_LIMIT = 1024 * 1024 * 1024;
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

export function FileTypeIcon({ file, className = "size-5" }: { file: Pick<ManagedFileDto, "mimeType" | "extension">; className?: string }) {
  const type = getFileType(file);
  if (type === "image") return <FileImage className={className} aria-hidden="true" />;
  if (type === "video") return <FileVideo className={className} aria-hidden="true" />;
  if (type === "audio") return <FileAudio className={className} aria-hidden="true" />;
  if (type === "archive") return <FileArchive className={className} aria-hidden="true" />;
  if (type === "document") return <FileText className={className} aria-hidden="true" />;
  return <FileIcon className={className} aria-hidden="true" />;
}

export function FileStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  if (["uploading", "pending"].includes(normalized)) {
    return <Badge variant="outline" className="gap-1.5 font-normal"><LoaderCircle className="animate-spin motion-reduce:animate-none" />Đang upload</Badge>;
  }
  if (["processing", "queued"].includes(normalized)) {
    return <Badge variant="outline" className="gap-1.5 font-normal"><LoaderCircle className="animate-spin motion-reduce:animate-none" />Đang xử lý</Badge>;
  }
  if (["failed", "error"].includes(normalized)) {
    return <Badge variant="destructive" className="gap-1.5"><CircleX />Thất bại</Badge>;
  }
  if (["archived", "trash"].includes(normalized)) {
    return <Badge variant="secondary" className="gap-1.5 font-normal"><Archive />Đã lưu trữ</Badge>;
  }
  return <Badge variant="outline" className="gap-1.5 font-normal"><CircleCheck className="text-[var(--files-success)]" />Sẵn sàng</Badge>;
}

