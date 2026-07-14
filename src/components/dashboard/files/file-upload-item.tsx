import { CircleCheck, CircleX, LoaderCircle, RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { formatBytes } from "./file-utils";
import type { UploadQueueItem } from "./types";

export function FileUploadItem({ item, onRetry, onCancel, onRemove }: { item: UploadQueueItem; onRetry: (id: string) => void; onCancel: (id: string) => void; onRemove: (id: string) => void }) {
  const isUploading = item.status === "uploading" || item.status === "pending";
  return (
    <div className="border-b border-border px-4 py-3 last:border-b-0">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-muted-foreground">{isUploading ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : item.status === "success" ? <CircleCheck className="size-4 text-[var(--files-success)]" /> : <CircleX className="size-4 text-destructive" />}</span>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-foreground">{item.file.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{formatBytes(item.file.size)} · {item.status === "pending" ? "Đang chờ" : item.status === "uploading" ? "Đang tải lên" : item.status === "success" ? "Hoàn tất" : item.status === "cancelled" ? "Đã hủy" : item.error || "Upload thất bại"}</p></div>
        {item.status === "error" ? <Button variant="ghost" size="icon-sm" onClick={() => onRetry(item.id)} aria-label={`Thử lại ${item.file.name}`}><RotateCcw /></Button> : null}
        {isUploading ? <Button variant="ghost" size="icon-sm" onClick={() => onCancel(item.id)} aria-label={`Hủy tải lên ${item.file.name}`}><X /></Button> : null}
        {!isUploading ? <Button variant="ghost" size="icon-sm" onClick={() => onRemove(item.id)} aria-label={`Xóa ${item.file.name} khỏi hàng đợi`}><X /></Button> : null}
      </div>
      {isUploading ? <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={`Đang tải ${item.file.name}`}><div className="h-full w-full animate-pulse rounded-full bg-primary/70 motion-reduce:animate-none" /></div> : null}
    </div>
  );
}
