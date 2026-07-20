"use client";

import type { ColumnDef, Row } from "@tanstack/react-table";
import {
  Archive,
  CalendarDays,
  CircleDashed,
  Ellipsis,
  Eye,
  FileText,
  Pencil,
  RotateCcw,
  Send,
  Trash2,
} from "lucide-react";
import Link from "next/link";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PageStatusBadge } from "@/features/admin-pages/components/page-status-badge";
import { pageStatusOptions } from "@/features/admin-pages/page-status";
import type {
  AdminPageListItem,
  PageStatus,
} from "@/features/admin-pages/types";

export type PageRowAction = {
  row: Row<AdminPageListItem>;
  variant: "delete";
};

export function getPagesTableColumns({
  canUpdate,
  canDelete,
  canPublish,
  onStatusChange,
  setRowAction,
}: {
  canUpdate: boolean;
  canDelete: boolean;
  canPublish: boolean;
  onStatusChange: (page: AdminPageListItem, status: PageStatus) => void;
  setRowAction: React.Dispatch<React.SetStateAction<PageRowAction | null>>;
}): ColumnDef<AdminPageListItem>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Chọn tất cả trang trên trang hiện tại"
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
          onClick={(event) => event.stopPropagation()}
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
        <DataTableColumnHeader column={column} label="Trang" />
      ),
      cell: ({ row }) => (
        <div className="flex min-w-64 max-w-[32rem] items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-md border bg-muted/30">
            <FileText className="size-4 text-primary" />
          </div>
          <div className="min-w-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={`/admin/pages/${row.original.id}`}
                    className="block truncate font-medium text-sm hover:text-primary hover:underline hover:underline-offset-4"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {row.original.title}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm">
                  {row.original.title}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <p className="max-w-80 truncate font-mono text-muted-foreground text-xs">
              /{row.original.slug}
            </p>
          </div>
        </div>
      ),
      meta: {
        label: "Tiêu đề",
        placeholder: "Lọc theo tiêu đề...",
        variant: "text",
        icon: FileText,
      },
      enableColumnFilter: true,
    },
    {
      id: "slug",
      accessorKey: "slug",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Slug" />
      ),
      cell: ({ row }) => (
        <span className="block max-w-56 truncate font-mono text-muted-foreground text-xs">
          {row.original.slug}
        </span>
      ),
      meta: {
        label: "Slug",
        placeholder: "Lọc theo slug...",
        variant: "text",
        icon: FileText,
      },
      enableColumnFilter: true,
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Trạng thái" />
      ),
      cell: ({ row }) => <PageStatusBadge status={row.original.status} />,
      meta: {
        label: "Trạng thái",
        variant: "multiSelect",
        options: pageStatusOptions,
        icon: CircleDashed,
      },
      enableColumnFilter: true,
    },
    {
      id: "sortOrder",
      accessorKey: "sortOrder",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Thứ tự" />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.sortOrder}</span>
      ),
    },
    {
      id: "updatedAt",
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Cập nhật" />
      ),
      cell: ({ row }) => (
        <time
          dateTime={row.original.updatedAt}
          className="whitespace-nowrap text-muted-foreground text-xs"
        >
          {formatDate(row.original.updatedAt)}
        </time>
      ),
      meta: {
        label: "Ngày cập nhật",
        variant: "dateRange",
        icon: CalendarDays,
      },
      enableColumnFilter: true,
    },
    {
      id: "publishedAt",
      accessorKey: "publishedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Xuất bản" />
      ),
      cell: ({ row }) =>
        row.original.publishedAt ? (
          <time
            dateTime={row.original.publishedAt}
            className="whitespace-nowrap text-muted-foreground text-xs"
          >
            {formatDate(row.original.publishedAt)}
          </time>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
      meta: {
        label: "Ngày xuất bản",
        variant: "dateRange",
        icon: CalendarDays,
      },
      enableColumnFilter: true,
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Ngày tạo" />
      ),
      cell: ({ row }) => (
        <time
          dateTime={row.original.createdAt}
          className="whitespace-nowrap text-muted-foreground text-xs"
        >
          {formatDate(row.original.createdAt)}
        </time>
      ),
      meta: {
        label: "Ngày tạo",
        variant: "dateRange",
        icon: CalendarDays,
      },
      enableColumnFilter: true,
    },
    {
      id: "actions",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={`Mở menu ${row.original.title}`}
              variant="ghost"
              className="flex size-8 p-0 data-[state=open]:bg-muted"
              onClick={(event) => event.stopPropagation()}
            >
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-52"
            onClick={(event) => event.stopPropagation()}
          >
            <DropdownMenuItem asChild>
              <Link href={`/admin/pages/${row.original.id}`}>
                <FileText /> Xem chi tiết
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/admin/pages/${row.original.id}/preview`}>
                <Eye /> Preview
              </Link>
            </DropdownMenuItem>
            {canUpdate && row.original.status !== "ARCHIVED" ? (
              <DropdownMenuItem asChild>
                <Link href={`/admin/pages/${row.original.id}/edit`}>
                  <Pencil /> Chỉnh sửa
                </Link>
              </DropdownMenuItem>
            ) : null}
            {(canUpdate || canDelete) && <DropdownMenuSeparator />}
            {canUpdate && canPublish && row.original.status === "DRAFT" ? (
              <DropdownMenuItem
                onSelect={() => onStatusChange(row.original, "PUBLISHED")}
              >
                <Send /> Xuất bản
              </DropdownMenuItem>
            ) : null}
            {canUpdate && row.original.status === "PUBLISHED" ? (
              <DropdownMenuItem
                onSelect={() => onStatusChange(row.original, "DRAFT")}
              >
                <RotateCcw /> Chuyển về nháp
              </DropdownMenuItem>
            ) : null}
            {canUpdate && row.original.status !== "ARCHIVED" ? (
              <DropdownMenuItem
                onSelect={() => onStatusChange(row.original, "ARCHIVED")}
              >
                <Archive /> Lưu trữ
              </DropdownMenuItem>
            ) : null}
            {canUpdate && row.original.status === "ARCHIVED" ? (
              <DropdownMenuItem
                onSelect={() => onStatusChange(row.original, "DRAFT")}
              >
                <RotateCcw /> Khôi phục về nháp
              </DropdownMenuItem>
            ) : null}
            {canDelete ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setRowAction({ row, variant: "delete" })}
                >
                  <Trash2 /> Xóa
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
