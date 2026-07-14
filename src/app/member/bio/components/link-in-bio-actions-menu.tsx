"use client"

import Link from "next/link"
import {
  BarChart3,
  Copy,
  CopyPlus,
  ExternalLink,
  MoreHorizontal,
  PauseCircle,
  Pencil,
  QrCode,
  Send,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { BioPageDto } from "@/lib/api-client"

export function LinkInBioActionsMenu({
  page,
  onCopy,
  onQr,
  onStats,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onDelete,
}: {
  page: BioPageDto
  onCopy: () => void
  onQr: () => void
  onStats: () => void
  onEdit: () => void
  onDuplicate: () => void
  onToggleStatus: () => void
  onDelete: () => void
}) {
  const published = page.status === "published"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="size-11 rounded-lg text-muted-foreground sm:size-9" aria-label={`Mở thao tác cho ${page.name}`}>
          <MoreHorizontal className="size-[18px]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-52 rounded-lg p-1.5">
        <DropdownMenuItem asChild><Link href={page.publicUrl} target="_blank" rel="noreferrer"><ExternalLink className="size-4" />Mở trang</Link></DropdownMenuItem>
        <DropdownMenuItem onSelect={onCopy}><Copy className="size-4" />Sao chép liên kết</DropdownMenuItem>
        <DropdownMenuItem onSelect={onQr}><QrCode className="size-4" />Xem mã QR</DropdownMenuItem>
        <DropdownMenuItem onSelect={onStats}><BarChart3 className="size-4" />Xem thống kê</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onEdit}><Pencil className="size-4" />Chỉnh sửa</DropdownMenuItem>
        <DropdownMenuItem onSelect={onDuplicate}><CopyPlus className="size-4" />Nhân bản</DropdownMenuItem>
        <DropdownMenuItem onSelect={onToggleStatus}>{published ? <PauseCircle className="size-4" /> : <Send className="size-4" />}{published ? "Tạm dừng" : "Xuất bản"}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onDelete}><Trash2 className="size-4" />Xóa</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

