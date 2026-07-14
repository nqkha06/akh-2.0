"use client";

import { Archive, Copy, Download, Edit3, Eye, Link2, MoreHorizontal, Trash2, Unplug } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { ManagedFileDto } from "@/lib/api-client";

type FileRowActionsProps = {
  file: ManagedFileDto;
  downloadUrl: string;
  onPreview: (file: ManagedFileDto) => void;
  onCopyUrl: (file: ManagedFileDto) => void;
  onCopyAlias: (file: ManagedFileDto) => void;
  onUseDestination: (file: ManagedFileDto) => void;
  onRename: (file: ManagedFileDto) => void;
  onDelete: (file: ManagedFileDto) => void;
};

export function FileRowActions({ file, downloadUrl, onPreview, onCopyUrl, onCopyAlias, onUseDestination, onRename, onDelete }: FileRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`Thao tác với ${file.name}`}><MoreHorizontal /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onSelect={() => onPreview(file)}><Eye />Xem trước</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onCopyUrl(file)}><Copy />Sao chép URL</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onCopyAlias(file)}><Link2 />Sao chép alias</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onUseDestination(file)}><Unplug />Dùng làm destination</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onRename(file)}><Edit3 />Đổi tên</DropdownMenuItem>
        <DropdownMenuItem asChild><a href={downloadUrl}><Download />Tải xuống</a></DropdownMenuItem>
        <DropdownMenuItem disabled><Archive />Di chuyển vào thư mục</DropdownMenuItem>
        <DropdownMenuItem disabled>Không có dữ liệu nơi sử dụng</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(file)}><Trash2 />Xóa</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

