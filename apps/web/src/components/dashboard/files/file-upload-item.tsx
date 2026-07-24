import { CircleCheck, CircleX, LoaderCircle, RotateCcw, X } from "lucide-react";

import { FileTypeIcon } from "@/components/file-type-icon";
import { Button } from "@/components/ui/button";

import { formatBytes } from "./file-utils";
import type { UploadQueueItem } from "./types";

export function FileUploadItem({
  item,
  onRetry,
  onCancel,
  onRemove,
}: {
  item: UploadQueueItem;
  onRetry: (id: string) => void;
  onCancel: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const isActive =
    item.status === "uploading" ||
    item.status === "pending" ||
    item.status === "finalizing";
  const canCancel =
    item.status === "uploading" || item.status === "pending";
  const isIndeterminateProgress =
    item.indeterminate &&
    (item.status === "pending" || item.status === "uploading");

  const statusText =
    item.status === "pending"
      ? "Đang chờ"
      : item.status === "uploading"
        ? item.indeterminate
          ? "Đang tải lên"
          : `Đang tải lên · ${item.progress}%`
        : item.status === "finalizing"
          ? "Đang hoàn tất"
          : item.status === "success"
            ? "Hoàn tất"
            : item.status === "cancelled"
              ? "Đã hủy"
              : item.error || "Upload thất bại";

  return (
    <div className="border-b border-border px-4 py-3 last:border-b-0">
      <div className="flex items-start gap-3">
        <FileTypeIcon file={item.file} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {item.file.name}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatBytes(item.file.size)} · {statusText}
          </p>
        </div>
        <span className="mt-2.5 text-muted-foreground">
          {isActive ? (
            <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
          ) : item.status === "success" ? (
            <CircleCheck className="size-4 text-[var(--files-success)]" />
          ) : (
            <CircleX className="size-4 text-destructive" />
          )}
        </span>
        {item.status === "error" ? <Button variant="ghost" size="icon-sm" onClick={() => onRetry(item.id)} aria-label={`Thử lại ${item.file.name}`}><RotateCcw /></Button> : null}
        {canCancel ? <Button variant="ghost" size="icon-sm" onClick={() => onCancel(item.id)} aria-label={`Hủy tải lên ${item.file.name}`}><X /></Button> : null}
        {!isActive ? <Button variant="ghost" size="icon-sm" onClick={() => onRemove(item.id)} aria-label={`Xóa ${item.file.name} khỏi hàng đợi`}><X /></Button> : null}
      </div>
      {isActive ? (
        <div
          className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label={`Đang tải ${item.file.name}`}
          aria-valuemin={isIndeterminateProgress ? undefined : 0}
          aria-valuemax={isIndeterminateProgress ? undefined : 100}
          aria-valuenow={
            isIndeterminateProgress ? undefined : item.progress
          }
          aria-valuetext={
            isIndeterminateProgress ? statusText : undefined
          }
        >
          <div
            className={
              isIndeterminateProgress
                ? "h-full w-2/3 animate-pulse rounded-full bg-primary/70 motion-reduce:animate-none"
                : "h-full rounded-full bg-primary transition-[width] duration-200 motion-reduce:transition-none"
            }
            style={
              isIndeterminateProgress
                ? undefined
                : { width: `${item.progress}%` }
            }
          />
        </div>
      ) : null}
    </div>
  );
}
