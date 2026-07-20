"use client";

import { Filter, RefreshCw, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type { FileSortOption, FilesFilters, FileStatusFilter, FileTypeFilter } from "./types";

type FilesToolbarProps = {
  query: string;
  filters: FilesFilters;
  sort: FileSortOption;
  loading?: boolean;
  onQueryChange: (value: string) => void;
  onTypeChange: (value: FileTypeFilter) => void;
  onStatusChange: (value: FileStatusFilter) => void;
  onSortChange: (value: FileSortOption) => void;
  onClear: () => void;
  onRefresh: () => void;
};

const typeOptions: Array<{ value: FileTypeFilter; label: string }> = [
  { value: "all", label: "Tất cả loại" }, { value: "image", label: "Hình ảnh" }, { value: "video", label: "Video" }, { value: "audio", label: "Âm thanh" }, { value: "document", label: "Tài liệu" }, { value: "archive", label: "File nén" }, { value: "other", label: "Khác" },
];
const statusOptions: Array<{ value: FileStatusFilter; label: string }> = [
  { value: "all", label: "Tất cả trạng thái" }, { value: "ready", label: "Sẵn sàng" }, { value: "processing", label: "Đang xử lý" }, { value: "failed", label: "Upload thất bại" }, { value: "private", label: "Riêng tư" }, { value: "public", label: "Công khai" },
];
const sortOptions: Array<{ value: FileSortOption; label: string }> = [
  { value: "newest", label: "Mới tải lên" }, { value: "oldest", label: "Cũ nhất" }, { value: "name-asc", label: "Tên A–Z" }, { value: "name-desc", label: "Tên Z–A" }, { value: "size-desc", label: "Dung lượng lớn nhất" }, { value: "size-asc", label: "Dung lượng nhỏ nhất" },
];

function FilterSelects({ filters, sort, onTypeChange, onStatusChange, onSortChange, showLabels = false }: Pick<FilesToolbarProps, "filters" | "sort" | "onTypeChange" | "onStatusChange" | "onSortChange"> & { showLabels?: boolean }) {
  return (
    <>
      <div className={showLabels ? "space-y-2" : ""}>{showLabels ? <p className="text-sm font-medium text-foreground">Loại file</p> : null}<Select value={filters.type} onValueChange={(value) => onTypeChange(value as FileTypeFilter)}><SelectTrigger className={`w-full bg-background shadow-none ${showLabels ? "" : "lg:w-36"}`} aria-label="Lọc theo loại file"><SelectValue /></SelectTrigger><SelectContent>{typeOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
      <div className={showLabels ? "space-y-2" : ""}>{showLabels ? <p className="text-sm font-medium text-foreground">Trạng thái</p> : null}<Select value={filters.status} onValueChange={(value) => onStatusChange(value as FileStatusFilter)}><SelectTrigger className={`w-full bg-background shadow-none ${showLabels ? "" : "lg:w-40"}`} aria-label="Lọc theo trạng thái"><SelectValue /></SelectTrigger><SelectContent>{statusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
      <div className={showLabels ? "space-y-2" : ""}>{showLabels ? <p className="text-sm font-medium text-foreground">Sắp xếp</p> : null}<Select value={sort} onValueChange={(value) => onSortChange(value as FileSortOption)}><SelectTrigger className={`w-full bg-background shadow-none ${showLabels ? "" : "lg:w-44"}`} aria-label="Sắp xếp file"><SelectValue /></SelectTrigger><SelectContent>{sortOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
    </>
  );
}

export function FilesToolbar(props: FilesToolbarProps) {
  const activeCount = Number(props.filters.type !== "all") + Number(props.filters.status !== "all");
  const hasCriteria = Boolean(props.query) || activeCount > 0 || props.sort !== "newest";

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center" role="search">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={props.query} onChange={(event) => props.onQueryChange(event.target.value)} placeholder="Tìm file..." className="h-10 bg-background pl-9 pr-9 shadow-none" aria-label="Tìm file" />
          {props.query ? <button type="button" className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => props.onQueryChange("")} aria-label="Xóa từ khóa"><X className="size-3.5" /></button> : null}
        </div>

        <div className="hidden items-center gap-2 lg:flex"><FilterSelects {...props} /></div>

        <div className="flex items-center gap-2 lg:hidden">
          <Sheet>
            <SheetTrigger asChild><Button variant="outline" className="h-11 flex-1 bg-background shadow-none"><Filter />Bộ lọc{activeCount ? <Badge className="ml-1 min-w-5 px-1.5">{activeCount}</Badge> : null}</Button></SheetTrigger>
            <SheetContent className="w-full sm:max-w-sm">
              <SheetHeader className="border-b border-border"><SheetTitle>Bộ lọc file</SheetTitle><SheetDescription>Thu hẹp danh sách theo loại, trạng thái và thứ tự.</SheetDescription></SheetHeader>
              <div className="space-y-5 px-4"><FilterSelects {...props} showLabels /></div>
              <SheetFooter className="border-t border-border"><Button variant="outline" onClick={props.onClear} disabled={!hasCriteria}>Xóa bộ lọc</Button></SheetFooter>
            </SheetContent>
          </Sheet>
          <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon-lg" className="size-11 bg-background shadow-none" onClick={props.onRefresh} disabled={props.loading} aria-label="Làm mới danh sách file"><RefreshCw className={props.loading ? "animate-spin motion-reduce:animate-none" : ""} /></Button></TooltipTrigger><TooltipContent>Làm mới danh sách</TooltipContent></Tooltip>
        </div>

        <div className="hidden lg:block"><Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="bg-background shadow-none" onClick={props.onRefresh} disabled={props.loading} aria-label="Làm mới danh sách file"><RefreshCw className={props.loading ? "animate-spin motion-reduce:animate-none" : ""} /></Button></TooltipTrigger><TooltipContent>Làm mới danh sách</TooltipContent></Tooltip></div>
      </div>
    </TooltipProvider>
  );
}
