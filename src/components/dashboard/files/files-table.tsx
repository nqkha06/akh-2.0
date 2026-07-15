"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getFileDownloadUrl, getFilePreviewUrl, type ManagedFileDto } from "@/lib/api-client";

import { FileRowActions } from "./file-row-actions";
import { FileStatusBadge, FileTypeIcon, formatFileDate, getFileType } from "./file-utils";
import type { ManagedFileView, UploadQueueItem } from "./types";

const typeLabels = { image: "Hình ảnh", video: "Video", audio: "Âm thanh", document: "Tài liệu", archive: "File nén", other: "Khác" } as const;

type FilesTableProps = {
  files: ManagedFileView[];
  uploads: UploadQueueItem[];
  selectedIds: Set<string>;
  page: number;
  pageCount: number;
  total: number;
  onPageChange: (page: number) => void;
  onSelect: (id: string, selected: boolean) => void;
  onSelectPage: (selected: boolean) => void;
  onPreview: (file: ManagedFileDto) => void;
  onCopyUrl: (file: ManagedFileDto) => void;
  onCopyAlias: (file: ManagedFileDto) => void;
  onUseDestination: (file: ManagedFileDto) => void;
  onRename: (file: ManagedFileDto) => void;
  onDelete: (file: ManagedFileDto) => void;
  onCancelUpload: (id: string) => void;
};

function FileVisual({ file }: { file: ManagedFileDto }) {
  if (file.mimeType.startsWith("image/")) {
    return <Image src={getFilePreviewUrl(file)} alt="" width={36} height={36} unoptimized className="size-9 rounded-md border border-border object-cover" />;
  }
  return <span className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-muted/40 text-muted-foreground"><FileTypeIcon file={file} className="size-4" /></span>;
}

export function FilesTable(props: FilesTableProps) {
  const selectedOnPage = props.files.filter((file) => props.selectedIds.has(file.id)).length;
  const allSelected = props.files.length > 0 && selectedOnPage === props.files.length;
  const indeterminate = selectedOnPage > 0 && !allSelected;

  return (
    <TooltipProvider>
      <section aria-label="Danh sách file" className="overflow-hidden rounded-xl border border-border bg-card">
        {props.uploads.filter((item) => item.status === "uploading" || item.status === "pending").map((item) => (
          <div key={item.id} className="flex min-h-16 items-center gap-3 border-b border-border bg-primary/5 px-3 sm:px-4">
            <LoaderUpload /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.file.name}</p><p className="text-xs text-muted-foreground">Đang tải lên · {item.progress}%</p><div className="mt-2 h-1.5 max-w-sm overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={`Đang tải ${item.file.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={item.progress}><div className="h-full rounded-full bg-primary transition-[width] duration-200 motion-reduce:transition-none" style={{ width: `${item.progress}%` }} /></div></div><Button variant="ghost" size="icon-sm" onClick={() => props.onCancelUpload(item.id)} aria-label={`Hủy tải lên ${item.file.name}`}><X /></Button>
          </div>
        ))}

        <div className="hidden overflow-x-auto md:block">
          <Table className="min-w-[1040px]">
            <TableHeader className="sticky top-0 z-10 bg-background shadow-[0_1px_0_var(--border)]">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 px-4">
                  <Checkbox checked={indeterminate ? "indeterminate" : allSelected} onCheckedChange={(checked) => props.onSelectPage(Boolean(checked))} aria-label="Chọn tất cả file trên trang" />
                </TableHead>
                <TableHead className="w-[52%]">File</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Dung lượng</TableHead>
                <TableHead>Ngày tải lên</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Hành động</span></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {props.files.map((file) => {
                const selected = props.selectedIds.has(file.id);
                return (
                  <TableRow key={file.id} data-state={selected ? "selected" : undefined} className="h-16 data-[state=selected]:bg-primary/5">
                    <TableCell className="px-4"><Checkbox checked={selected} onCheckedChange={(checked) => props.onSelect(file.id, Boolean(checked))} aria-label={`Chọn ${file.name}`} /></TableCell>
                    <TableCell><div className="flex min-w-0 items-center gap-3"><FileVisual file={file} /><div className="min-w-0"><Tooltip><TooltipTrigger asChild><button type="button" className="block max-w-72 truncate text-left text-sm font-medium text-foreground hover:text-primary hover:underline" onClick={() => props.onPreview(file)}>{file.name}</button></TooltipTrigger><TooltipContent>{file.name}</TooltipContent></Tooltip><p className="mt-0.5 max-w-72 truncate text-xs text-muted-foreground">/{file.alias}</p></div></div></TableCell>
                    <TableCell className="text-muted-foreground">{typeLabels[getFileType(file)]}</TableCell>
                    <TableCell className="font-medium tabular-nums">{file.sizeLabel}</TableCell>
                    <TableCell className="text-muted-foreground">{formatFileDate(file.createdAt)}</TableCell>
                    <TableCell className="pr-3"><FileRowActions file={file} downloadUrl={getFileDownloadUrl(file)} onPreview={props.onPreview} onCopyUrl={props.onCopyUrl} onCopyAlias={props.onCopyAlias} onUseDestination={props.onUseDestination} onRename={props.onRename} onDelete={props.onDelete} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="divide-y divide-border md:hidden">
          {props.files.map((file) => {
            const selected = props.selectedIds.has(file.id);
            return <article key={file.id} className={`flex min-h-[76px] items-center gap-3 px-2 py-3 ${selected ? "bg-primary/5" : ""}`}><Checkbox checked={selected} onCheckedChange={(checked) => props.onSelect(file.id, Boolean(checked))} aria-label={`Chọn ${file.name}`} /><FileVisual file={file} /><div className="min-w-0 flex-1"><button type="button" className="block max-w-full truncate text-left text-sm font-medium text-foreground" onClick={() => props.onPreview(file)}>{file.name}</button><div className="mt-1 flex items-center gap-2"><FileStatusBadge status={file.status} /><span className="text-xs tabular-nums text-muted-foreground">{file.sizeLabel}</span></div></div><FileRowActions file={file} downloadUrl={getFileDownloadUrl(file)} onPreview={props.onPreview} onCopyUrl={props.onCopyUrl} onCopyAlias={props.onCopyAlias} onUseDestination={props.onUseDestination} onRename={props.onRename} onDelete={props.onDelete} /></article>;
          })}
        </div>

        <footer className="flex flex-col gap-3 border-t border-border px-3 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Hiển thị {props.files.length} trong {props.total} file</span>
          {props.pageCount > 1 ? <div className="flex items-center gap-2"><Button variant="outline" size="icon-sm" onClick={() => props.onPageChange(props.page - 1)} disabled={props.page <= 1} aria-label="Trang trước"><ChevronLeft /></Button><span>Trang {props.page} / {props.pageCount}</span><Button variant="outline" size="icon-sm" onClick={() => props.onPageChange(props.page + 1)} disabled={props.page >= props.pageCount} aria-label="Trang sau"><ChevronRight /></Button></div> : null}
        </footer>
      </section>
    </TooltipProvider>
  );
}

function LoaderUpload() {
  return <span className="grid size-9 shrink-0 place-items-center rounded-md border border-primary/20 bg-primary/10 text-primary"><span className="size-3 animate-pulse rounded-full bg-primary motion-reduce:animate-none" /></span>;
}
