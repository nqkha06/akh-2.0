"use client";

import { TablePagination } from "@/components/table-pagination";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ManagedFileDto } from "@/lib/api-client";

import { FileRowActions } from "./file-row-actions";
import { FileTypeIcon, formatFileDate, getFileType } from "./file-utils";
import type { ManagedFileView } from "./types";

const typeLabels = { image: "Hình ảnh", video: "Video", audio: "Âm thanh", document: "Tài liệu", archive: "File nén", other: "Khác" } as const;

type FilesTableProps = {
  files: ManagedFileView[];
  selectedIds: Set<string>;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSelect: (id: string, selected: boolean) => void;
  onSelectPage: (selected: boolean) => void;
  onPreview: (file: ManagedFileDto) => void;
  onRename: (file: ManagedFileDto) => void;
  onDelete: (file: ManagedFileDto) => void;
};

function FileVisual({ file }: { file: ManagedFileDto }) {
  return <FileTypeIcon file={file} />;
}

export function FilesTable(props: FilesTableProps) {
  const selectedOnPage = props.files.filter((file) => props.selectedIds.has(file.id)).length;
  const allSelected = props.files.length > 0 && selectedOnPage === props.files.length;
  const indeterminate = selectedOnPage > 0 && !allSelected;

  return (
    <TooltipProvider>
      <section aria-label="Danh sách file" className="overflow-hidden rounded-xl border border-border bg-card">
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
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-3">
                        <FileVisual file={file} />
                        <div className="min-w-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" className="block max-w-72 truncate text-left text-sm font-medium text-foreground hover:text-primary hover:underline" onClick={() => props.onPreview(file)}>{file.name}</button></TooltipTrigger><TooltipContent>{file.name}</TooltipContent>
                          </Tooltip>
                              
                          {/* <p className="mt-0.5 max-w-72 truncate text-xs text-muted-foreground">/{file.alias}</p> */}
                        </div></div>
                          </TableCell>
                    <TableCell className="text-muted-foreground">{typeLabels[getFileType(file)]}</TableCell>
                    <TableCell className="font-medium tabular-nums">{file.sizeLabel}</TableCell>
                    <TableCell className="text-muted-foreground">{formatFileDate(file.createdAt)}</TableCell>
                    <TableCell className="pr-3"><FileRowActions file={file} onPreview={props.onPreview} onRename={props.onRename} onDelete={props.onDelete} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="divide-y divide-border md:hidden">
          {props.files.map((file) => {
          const selected = props.selectedIds.has(file.id);
          return <article key={file.id} className={`flex min-h-[76px] items-center gap-3 px-2 py-3 ${selected ? "bg-primary/5" : "" }`}>
              <Checkbox checked={selected} onCheckedChange={(checked)=> props.onSelect(file.id, Boolean(checked))} aria-label={`Chọn ${file.name}`} />
                  <FileVisual file={file} />
                  <div className="min-w-0 flex-1"><button type="button" className="block max-w-full truncate text-left text-sm font-medium text-foreground" onClick={()=> props.onPreview(file)}>{file.name}</button>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs tabular-nums text-muted-foreground">{file.sizeLabel}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{formatFileDate(file.createdAt)}</span>
                      </div>
                  </div>
                  <FileRowActions file={file} onPreview={props.onPreview} onRename={props.onRename} onDelete={props.onDelete} />
          </article>;
          })}
      </div>

        <footer className="border-t border-border px-3 py-3">
          <TablePagination
            page={props.page}
            pageSize={props.pageSize}
            totalItems={props.total}
            onPageChange={props.onPageChange}
            onPageSizeChange={props.onPageSizeChange}
          />
        </footer>
      </section>
    </TooltipProvider>
  );
}
