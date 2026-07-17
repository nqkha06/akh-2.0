"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  CalendarIcon,
  CircleDashed,
  Ellipsis,
  Shield,
  UserRound,
} from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminUser } from "@/features/admin-users/types";
import type { DataTableRowAction } from "@/types/data-table";

const roleOptions = [
  { label: "Admin", value: "admin", icon: Shield },
  { label: "Member", value: "member", icon: UserRound },
];

const statusOptions = [
  { label: "Hoạt động", value: "active" },
  { label: "Không hoạt động", value: "inactive" },
  { label: "Đã khóa", value: "locked" },
  { label: "Tạm ngưng", value: "suspended" },
  { label: "Vô hiệu hóa", value: "disabled" },
];

export function getUsersTableColumns({
  currentUserId,
  setRowAction,
}: {
  currentUserId: number;
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<AdminUser> | null>
  >;
}): ColumnDef<AdminUser>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all"
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label="Select row"
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableHiding: false,
      enableSorting: false,
      size: 40,
    },
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Người dùng" />
      ),
      cell: ({ row }) => (
        <div className="flex min-w-56 items-center gap-3">
          <Avatar className="size-9 rounded-lg border">
            <AvatarImage
              src={row.original.avatar || undefined}
              alt={row.original.name}
            />
            <AvatarFallback className="rounded-lg text-xs">
              {initials(row.original.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium text-sm">
                {row.original.name}
              </span>
              {row.original.id === currentUserId ? (
                <Badge variant="outline">Bạn</Badge>
              ) : null}
            </div>
            <span className="block truncate text-muted-foreground text-xs">
              {row.original.email}
            </span>
          </div>
        </div>
      ),
      meta: {
        label: "Tên",
        placeholder: "Lọc theo tên...",
        variant: "text",
        icon: UserRound,
      },
      enableColumnFilter: true,
    },
    {
      id: "email",
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Email" />
      ),
      meta: {
        label: "Email",
        placeholder: "Lọc theo email...",
        variant: "text",
        icon: UserRound,
      },
      enableColumnFilter: true,
    },
    {
      id: "role",
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Role" />
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.role}
        </Badge>
      ),
      meta: {
        label: "Role",
        variant: "multiSelect",
        options: roleOptions,
        icon: Shield,
      },
      enableColumnFilter: true,
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Trạng thái" />
      ),
      cell: ({ row }) => <UserStatusCell status={row.original.status} />,
      meta: {
        label: "Trạng thái",
        variant: "multiSelect",
        options: statusOptions,
        icon: CircleDashed,
      },
      enableColumnFilter: true,
    },
    {
      id: "linksCount",
      accessorKey: "linksCount",
      header: "Nội dung",
      enableSorting: false,
    },
    {
      id: "activeSessionsCount",
      accessorKey: "activeSessionsCount",
      header: "Phiên",
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
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="Open menu"
              variant="ghost"
              className="flex size-8 p-0 data-[state=open]:bg-muted"
            >
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onSelect={() => setRowAction({ row, variant: "update" })}
            >
              Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={row.original.id === currentUserId}
              onSelect={() => setRowAction({ row, variant: "delete" })}
            >
              Xóa người dùng
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}

function UserStatusCell({ status }: { status: string }) {
  if (status === "active") {
    return (
      <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
        Hoạt động
      </Badge>
    );
  }

  const labels: Record<string, string> = {
    inactive: "Không hoạt động",
    locked: "Đã khóa",
    suspended: "Tạm ngưng",
    disabled: "Vô hiệu hóa",
  };

  return (
    <Badge variant="outline" className="bg-muted text-muted-foreground">
      {labels[status] || status}
    </Badge>
  );
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
