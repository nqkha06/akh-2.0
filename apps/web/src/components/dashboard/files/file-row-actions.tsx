"use client";

import { Edit3, Eye, MoreHorizontal, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { ManagedFileDto } from "@/lib/api-client";

type FileRowActionsProps = {
  file: ManagedFileDto;
  onPreview: (file: ManagedFileDto) => void;
  onRename: (file: ManagedFileDto) => void;
  onDelete: (file: ManagedFileDto) => void;
};

export function FileRowActions({ file, onPreview, onRename, onDelete }: FileRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`Thao tác với ${file.name}`}><MoreHorizontal /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onSelect={() => onPreview(file)}><Eye />Xem trước</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onRename(file)}><Edit3 />Đổi tên</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(file)}><Trash2 />Xóa</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
