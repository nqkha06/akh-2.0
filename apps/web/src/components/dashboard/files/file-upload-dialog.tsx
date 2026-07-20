"use client";

import { useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import { FileUp, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

import { FileUploadItem } from "./file-upload-item";
import { FILE_SIZE_LIMIT, formatBytes } from "./file-utils";
import type { UploadQueueItem } from "./types";

type FileUploadDialogProps = {
  open: boolean;
  queue: UploadQueueItem[];
  onOpenChange: (open: boolean) => void;
  onFilesSelected: (files: File[]) => void;
  onRetry: (id: string) => void;
  onCancel: (id: string) => void;
  onRemove: (id: string) => void;
};

export function FileUploadDialog({ open, queue, onOpenChange, onFilesSelected, onRetry, onCancel, onRemove }: FileUploadDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const hasActiveUpload = queue.some((item) => item.status === "pending" || item.status === "uploading");

  const chooseFiles = () => inputRef.current?.click();
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault(); setDragging(false);
    if (event.dataTransfer.files.length) onFilesSelected(Array.from(event.dataTransfer.files));
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); chooseFiles(); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-border px-5 py-4 pr-12"><DialogTitle>Tải file lên</DialogTitle><DialogDescription>Thêm một hoặc nhiều file vào thư viện Rekonise.</DialogDescription></DialogHeader>
        <div className="p-5">
          <div
            role="button"
            tabIndex={0}
            aria-label="Chọn file hoặc kéo thả file để tải lên"
            onClick={chooseFiles}
            onKeyDown={handleKeyDown}
            onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`grid min-h-36 place-items-center rounded-lg border border-dashed px-5 py-6 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${dragging ? "border-primary bg-primary/5" : "border-border bg-muted/20 hover:bg-muted/40"}`}
          >
            <div><FileUp className="mx-auto size-6 text-primary" /><p className="mt-3 text-sm font-medium text-foreground">Kéo file vào đây hoặc chọn từ thiết bị</p><p id="supported-formats" className="mt-1.5 text-xs leading-5 text-muted-foreground">Tối đa {formatBytes(FILE_SIZE_LIMIT)} mỗi file. Hỗ trợ hình ảnh, video, âm thanh, tài liệu và file nén.</p></div>
          </div>
          <input ref={inputRef} type="file" multiple className="sr-only" onChange={(event) => { if (event.target.files?.length) onFilesSelected(Array.from(event.target.files)); event.target.value = ""; }} />
        </div>

        {queue.length ? <div className="border-t border-border"><div className="flex items-center justify-between px-4 py-2.5 text-xs text-muted-foreground"><span>Hàng đợi upload</span><span>{queue.length} file</span></div><ScrollArea className="max-h-64 border-t border-border"><div>{queue.map((item) => <FileUploadItem key={item.id} item={item} onRetry={onRetry} onCancel={onCancel} onRemove={onRemove} />)}</div></ScrollArea></div> : null}

        <DialogFooter className="border-t border-border px-5 py-4"><Button variant="outline" onClick={() => onOpenChange(false)}>{hasActiveUpload ? "Đóng và tiếp tục nền" : "Đóng"}</Button><Button onClick={chooseFiles}><Upload />Chọn thêm file</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
