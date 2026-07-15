import type { ManagedFileDto } from "@/lib/api-client";

export type FileTypeFilter = "all" | "image" | "video" | "audio" | "document" | "archive" | "other";
export type FileStatusFilter = "all" | "ready" | "processing" | "failed" | "private" | "public";
export type FileSortOption = "newest" | "oldest" | "name-asc" | "name-desc" | "size-desc" | "size-asc";

export type UploadQueueStatus = "pending" | "uploading" | "success" | "error" | "cancelled";

export type UploadQueueItem = {
  id: string;
  file: File;
  status: UploadQueueStatus;
  progress: number;
  error?: string;
};

export type ManagedFileView = ManagedFileDto & {
  usageCount: number | null;
};

export type FilesFilters = {
  type: FileTypeFilter;
  status: FileStatusFilter;
};
