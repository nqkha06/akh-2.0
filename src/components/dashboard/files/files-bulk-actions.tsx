import { Download, Globe2, LockKeyhole, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type FilesBulkActionsProps = {
  count: number;
  busy?: boolean;
  onDownload: () => void;
  onVisibilityChange: (isPublic: boolean) => void;
  onDelete: () => void;
  onClear: () => void;
};

export function FilesBulkActions({ count, busy, onDownload, onVisibilityChange, onDelete, onClear }: FilesBulkActionsProps) {
  if (!count) return null;
  return (
    <div className="sticky top-16 z-20 flex flex-wrap items-center gap-2 border-b border-border bg-card/95 px-3 py-2.5 backdrop-blur" role="toolbar" aria-label="Thao tác hàng loạt">
      <span className="mr-auto text-sm font-medium text-foreground">{count} file đã chọn</span>
      <Button variant="ghost" size="sm" onClick={onDownload} disabled={busy}><Download />Tải xuống</Button>
      <Button variant="ghost" size="sm" onClick={() => onVisibilityChange(true)} disabled={busy}><Globe2 />Công khai</Button>
      <Button variant="ghost" size="sm" onClick={() => onVisibilityChange(false)} disabled={busy}><LockKeyhole />Riêng tư</Button>
      <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={onDelete} disabled={busy}><Trash2 />Xóa</Button>
      <Button variant="ghost" size="icon-sm" onClick={onClear} aria-label="Bỏ chọn tất cả"><X /></Button>
    </div>
  );
}

