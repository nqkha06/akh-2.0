"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { FileUploadItem } from "./file-upload-item";
import type { UploadQueueItem } from "./types";

type FilesUploadTrayProps = {
  queue: UploadQueueItem[];
  hidden?: boolean;
  onRetry: (id: string) => void;
  onCancel: (id: string) => void;
  onRemove: (id: string) => void;
};

export function FilesUploadTray({
  queue,
  hidden = false,
  onRetry,
  onCancel,
  onRemove,
}: FilesUploadTrayProps) {
  const [collapsed, setCollapsed] = useState(false);
  const activeCount = queue.filter(
    (item) =>
      item.status === "pending" ||
      item.status === "uploading" ||
      item.status === "finalizing",
  ).length;
  const errorCount = queue.filter((item) => item.status === "error").length;

  if (hidden || queue.length === 0) return null;

  const title =
    activeCount > 0
      ? `Đang tải ${activeCount} file`
      : errorCount > 0
        ? `${errorCount} file cần xử lý`
        : "Upload hoàn tất";

  return (
    <aside
      className="fixed inset-x-4 bottom-4 z-50 overflow-hidden rounded-xl border border-border bg-card shadow-lg sm:left-auto sm:w-[380px]"
      aria-label="Tiến trình tải file"
      aria-live="polite"
    >
      <div
        className={cn(
          "flex min-h-12 items-center gap-3 px-4",
          collapsed ? "" : "border-b border-border",
        )}
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <UploadCloud className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {title}
          </p>
          <p className="text-xs text-muted-foreground">
            {queue.length} mục trong hàng đợi
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed((current) => !current)}
          aria-label={collapsed ? "Mở tiến trình upload" : "Thu gọn tiến trình upload"}
          aria-expanded={!collapsed}
        >
          {collapsed ? <ChevronUp /> : <ChevronDown />}
        </Button>
      </div>

      {collapsed ? null : (
        <div className="max-h-[min(60dvh,22rem)] overflow-y-auto">
          {queue.map((item) => (
            <FileUploadItem
              key={item.id}
              item={item}
              onRetry={onRetry}
              onCancel={onCancel}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </aside>
  );
}
