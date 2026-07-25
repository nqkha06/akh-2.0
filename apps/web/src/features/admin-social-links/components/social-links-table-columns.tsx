"use client"

import type { ColumnDef, Row } from "@tanstack/react-table"
import {
  CalendarIcon,
  CircleDashed,
  Ellipsis,
  ExternalLink,
  FileText,
  Link2,
  MousePointerClick,
  RotateCcw,
  Trash2,
  UserRound,
  Workflow,
} from "lucide-react"

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { AdminSocialLink } from "@/features/admin-social-links/types"

export type SocialLinkRowAction = {
  row: Row<AdminSocialLink>
  variant: "update" | "delete" | "restore"
}

const statusOptions = [
  { label: "Hoạt động", value: "active" },
  { label: "Không hoạt động", value: "inactive" },
  { label: "Tạm dừng", value: "paused" },
]

const destinationOptions = [
  { label: "URL", value: "url" },
  { label: "File", value: "file" },
  { label: "Snippet", value: "snippet" },
]

const deletionOptions = [
  { label: "Đang sử dụng", value: "active" },
  { label: "Trong thùng rác", value: "deleted" },
]

export function getSocialLinksTableColumns({
  canDelete,
  canUpdate,
  setRowAction,
}: {
  canDelete: boolean
  canUpdate: boolean
  setRowAction: React.Dispatch<
    React.SetStateAction<SocialLinkRowAction | null>
  >
}): ColumnDef<AdminSocialLink>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Chọn tất cả social link trên trang"
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) =>
            table.toggleAllPageRowsSelected(Boolean(value))
          }
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={`Chọn ${row.original.title}`}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
        />
      ),
      enableHiding: false,
      enableSorting: false,
      size: 40,
    },
    {
      id: "title",
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Social link" />
      ),
      cell: ({ row }) => (
        <div className="flex min-w-64 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
            <Link2 className="size-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-sm">
              {row.original.title}
            </p>
            <a
              href={`/l/${row.original.slug}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 truncate text-muted-foreground text-xs hover:text-foreground"
            >
              /l/{row.original.slug}
              <ExternalLink className="size-3 shrink-0" />
            </a>
          </div>
        </div>
      ),
      meta: {
        label: "Tiêu đề hoặc alias",
        placeholder: "Tìm social link...",
        variant: "text",
        icon: Link2,
      },
      enableColumnFilter: true,
    },
    {
      id: "owner",
      accessorFn: (row) => row.owner.email,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Chủ sở hữu" />
      ),
      cell: ({ row }) => (
        <div className="flex min-w-52 items-center gap-2">
          <Avatar className="size-8 border">
            <AvatarImage
              src={row.original.owner.avatar ?? undefined}
              alt={row.original.owner.name}
            />
            <AvatarFallback className="text-xs">
              {initials(row.original.owner.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm">{row.original.owner.name}</p>
            <p className="truncate text-muted-foreground text-xs">
              {row.original.owner.email}
            </p>
          </div>
        </div>
      ),
      meta: {
        label: "Chủ sở hữu",
        placeholder: "Tên hoặc email...",
        variant: "text",
        icon: UserRound,
      },
      enableColumnFilter: true,
      enableSorting: false,
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Trạng thái" />
      ),
      cell: ({ row }) => <LinkStatusCell link={row.original} />,
      meta: {
        label: "Trạng thái",
        variant: "multiSelect",
        options: statusOptions,
        icon: CircleDashed,
      },
      enableColumnFilter: true,
    },
    {
      id: "destinationType",
      accessorKey: "destinationType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Destination" />
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="uppercase">
          {row.original.destinationType}
        </Badge>
      ),
      meta: {
        label: "Destination",
        variant: "multiSelect",
        options: destinationOptions,
        icon: FileText,
      },
      enableColumnFilter: true,
      enableSorting: false,
    },
    {
      id: "views",
      accessorKey: "views",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Visit hoàn tất" />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums">
          {new Intl.NumberFormat("vi-VN").format(row.original.views)}
        </span>
      ),
      meta: {
        label: "Visit hoàn tất",
        placeholder: "Nhập số visit...",
        variant: "number",
        icon: MousePointerClick,
      },
      enableColumnFilter: true,
    },
    {
      id: "actionsCount",
      accessorKey: "actionsCount",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="tabular-nums">{row.original.actionsCount}</span>
          <div className="flex max-w-32 gap-1 overflow-hidden">
            {row.original.platforms.slice(0, 2).map((platform) => (
              <Badge key={platform} variant="secondary" className="text-xs">
                {platform}
              </Badge>
            ))}
          </div>
        </div>
      ),
      enableSorting: false,
    },
    {
      id: "deletedState",
      accessorKey: "deletedState",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Phạm vi" />
      ),
      cell: ({ row }) =>
        row.original.deletedAt ? (
          <Badge variant="destructive">Thùng rác</Badge>
        ) : (
          <Badge variant="outline">Đang sử dụng</Badge>
        ),
      meta: {
        label: "Phạm vi",
        variant: "multiSelect",
        options: deletionOptions,
        icon: Trash2,
      },
      enableColumnFilter: true,
      enableSorting: false,
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Ngày tạo" />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground text-xs">
          {formatDate(row.original.createdAt)}
        </span>
      ),
      meta: {
        label: "Ngày tạo",
        variant: "dateRange",
        icon: CalendarIcon,
      },
      enableColumnFilter: true,
    },
    {
      id: "actions",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) =>
        canDelete || canUpdate ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label={`Mở menu ${row.original.title}`}
                variant="ghost"
                className="flex size-8 p-0 data-[state=open]:bg-muted"
              >
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <a
                  href={`/l/${row.original.slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink /> Mở link công khai
                </a>
              </DropdownMenuItem>
              {canUpdate && !row.original.deletedAt ? (
                <DropdownMenuItem
                  onSelect={() =>
                    setRowAction({ row, variant: "update" })
                  }
                >
                  <Workflow /> Chỉnh sửa
                </DropdownMenuItem>
              ) : null}
              {(canUpdate || canDelete) && (
                <DropdownMenuSeparator />
              )}
              {canUpdate && row.original.deletedAt ? (
                <DropdownMenuItem
                  onSelect={() =>
                    setRowAction({ row, variant: "restore" })
                  }
                >
                  <RotateCcw /> Khôi phục
                </DropdownMenuItem>
              ) : null}
              {canDelete && !row.original.deletedAt ? (
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() =>
                    setRowAction({ row, variant: "delete" })
                  }
                >
                  <Trash2 /> Chuyển vào thùng rác
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null,
    },
  ]
}

function LinkStatusCell({ link }: { link: AdminSocialLink }) {
  if (link.deletedAt) {
    return <Badge variant="destructive">Đã xóa</Badge>
  }
  if (link.status === "active") {
    return (
      <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
        Hoạt động
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="bg-muted text-muted-foreground">
      {link.status === "paused" ? "Tạm dừng" : "Không hoạt động"}
    </Badge>
  )
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}
