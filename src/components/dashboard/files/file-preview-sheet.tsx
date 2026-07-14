"use client";

import Image from "next/image";
import { useState } from "react";
import { Copy, Download, Edit3, Globe2, LockKeyhole, Save, Trash2, Unplug } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getFileDownloadUrl, getFilePreviewUrl, type ManagedFileDto } from "@/lib/api-client";

import { FileStatusBadge, FileTypeIcon, formatFileDate } from "./file-utils";

type FilePreviewSheetProps = {
  file: ManagedFileDto | null;
  open: boolean;
  mode: "preview" | "rename";
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onCopyUrl: (file: ManagedFileDto) => void;
  onUseDestination: (file: ManagedFileDto) => void;
  onRename: (file: ManagedFileDto, name: string) => void;
  onToggleVisibility: (file: ManagedFileDto) => void;
  onDelete: (file: ManagedFileDto) => void;
};

export function FilePreviewSheet({ file, ...props }: FilePreviewSheetProps) {
  if (!file) return null;
  return <FilePreviewSheetContent key={`${file.id}-${props.mode}`} file={file} {...props} />;
}

function FilePreviewSheetContent({ file, open, mode, saving, onOpenChange, onCopyUrl, onUseDestination, onRename, onToggleVisibility, onDelete }: Omit<FilePreviewSheetProps, "file"> & { file: ManagedFileDto }) {
  const [editing, setEditing] = useState(mode === "rename");
  const [name, setName] = useState(file.name);

  const downloadUrl = getFileDownloadUrl(file);
  const isImage = file.mimeType.startsWith("image/");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 bg-card p-0 sm:max-w-[460px]">
        <SheetHeader className="border-b border-border px-5 py-4 pr-12"><SheetTitle className="truncate">{file.name}</SheetTitle><SheetDescription>Thông tin chi tiết và cách sử dụng file.</SheetDescription></SheetHeader>
        <ScrollArea className="min-h-0 flex-1">
          <div className="p-5">
            <div className="grid min-h-56 place-items-center overflow-hidden rounded-lg border border-border bg-muted/30">
              {isImage ? <Image src={getFilePreviewUrl(file)} alt={`Xem trước ${file.name}`} width={720} height={480} unoptimized className="max-h-72 w-full object-contain" /> : <div className="text-center text-muted-foreground"><FileTypeIcon file={file} className="mx-auto size-12" /><p className="mt-3 text-xs">Định dạng này không hỗ trợ xem trước trực tiếp.</p></div>}
            </div>

            <div className="mt-5 flex items-center justify-between gap-3"><FileStatusBadge status={file.status} /><span className="flex items-center gap-1 text-xs text-muted-foreground">{file.isPublic ? <Globe2 className="size-3.5" /> : <LockKeyhole className="size-3.5" />}{file.isPublic ? "Công khai" : "Riêng tư"}</span></div>

            <div className="mt-5">
              {editing ? <div className="flex gap-2"><Input value={name} onChange={(event) => setName(event.target.value)} aria-label="Tên file mới" className="h-10" /><Button size="icon-lg" onClick={() => { onRename(file, name); setEditing(false); }} disabled={!name.trim() || saving} aria-label="Lưu tên file"><Save /></Button></div> : <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs text-muted-foreground">Tên file</p><p className="mt-1 break-words text-sm font-medium text-foreground">{file.name}</p></div><Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)} aria-label="Đổi tên file"><Edit3 /></Button></div>}
            </div>

            <Separator className="my-5" />
            <dl className="space-y-3 text-sm">
              <Metadata label="Alias" value={`/${file.alias}`} />
              <Metadata label="MIME type" value={file.mimeType} />
              <Metadata label="Dung lượng" value={file.sizeLabel} />
              <Metadata label="Ngày tải lên" value={formatFileDate(file.createdAt, true)} />
              <Metadata label="Người tải lên" value="Bạn" />
              <Metadata label="URL" value={downloadUrl} breakAll />
              <Metadata label="Được sử dụng tại" value="API chưa cung cấp dữ liệu" />
            </dl>

            <Separator className="my-5" />
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="outline" onClick={() => onCopyUrl(file)}><Copy />Sao chép URL</Button>
              <Button variant="outline" asChild><a href={downloadUrl}><Download />Tải xuống</a></Button>
              <Button variant="outline" onClick={() => onToggleVisibility(file)}>{file.isPublic ? <LockKeyhole /> : <Globe2 />}{file.isPublic ? "Chuyển riêng tư" : "Chuyển công khai"}</Button>
              <Button variant="outline" onClick={() => onUseDestination(file)}><Unplug />Dùng làm destination</Button>
            </div>
          </div>
        </ScrollArea>
        <SheetFooter className="border-t border-border"><Button variant="destructive" onClick={() => onDelete(file)}><Trash2 />Xóa file</Button></SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Metadata({ label, value, breakAll = false }: { label: string; value: string; breakAll?: boolean }) {
  return <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3"><dt className="text-muted-foreground">{label}</dt><dd className={`text-right text-foreground ${breakAll ? "break-all" : "break-words"}`}>{value}</dd></div>;
}
