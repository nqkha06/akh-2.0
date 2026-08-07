"use client";

import type { ColumnDef, Row } from "@tanstack/react-table";
import {
  Award,
  Ban,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Ellipsis,
  Eye,
  KeyRound,
  LogIn,
  LockKeyhole,
  Pencil,
  Shield,
  Trash2,
  UserRound,
  WalletCards,
  Zap,
} from "lucide-react";
import Link from "next/link";

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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserStatusBadge } from "@/features/admin-users/components/user-status-badge";
import type {
  AdminUserListItem,
  UserStatus,
} from "@/features/admin-users/types";
import { userStatusOptions } from "@/features/admin-users/user-status";
import { formatDate } from "@/lib/format";

export type UserRowAction = {
  row: Row<AdminUserListItem>;
  variant: "delete" | "revoke-sessions" | "impersonate";
};

export function getUsersTableColumns({
  currentUserId,
  canUpdate,
  canDelete,
  canManageStatus,
  canRevokeSessions,
  canImpersonate,
  roleOptions,
  onStatusChange,
  setRowAction,
}: {
  currentUserId: number;
  canUpdate: boolean;
  canDelete: boolean;
  canManageStatus: boolean;
  canRevokeSessions: boolean;
  canImpersonate: boolean;
  roleOptions: Array<{ label: string; value: string; icon: typeof Shield }>;
  onStatusChange: (user: AdminUserListItem, status: UserStatus) => void;
  setRowAction: React.Dispatch<React.SetStateAction<UserRowAction | null>>;
}): ColumnDef<AdminUserListItem>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Chọn tất cả người dùng trên trang hiện tại"
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
          aria-label={`Chọn ${row.original.name}`}
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onClick={(event) => event.stopPropagation()}
          onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
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
        <div className="flex min-w-64 max-w-[28rem] items-center gap-3">
          <Avatar className="size-9 shrink-0 rounded-lg border">
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
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={`/admin/users/${row.original.id}`}
                      className="block truncate font-medium text-sm hover:text-primary hover:underline hover:underline-offset-4"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {row.original.name}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>{row.original.name}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {row.original.id === currentUserId ? (
                <Badge variant="outline">Bạn</Badge>
              ) : null}
            </div>
            <p className="truncate text-muted-foreground text-xs">
              {row.original.email}
            </p>
          </div>
        </div>
      ),
      meta: {
        label: "Tên hoặc email",
        placeholder: "Tìm tên hoặc email...",
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
      cell: ({ row }) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block max-w-64 truncate text-sm">
                {row.original.email}
              </span>
            </TooltipTrigger>
            <TooltipContent>{row.original.email}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
        <div className="flex max-w-60 flex-wrap gap-1">
          {row.original.roles.map((role) => (
            <Badge key={role.id} variant="outline">
              {role.name}
            </Badge>
          ))}
        </div>
      ),
      meta: {
        label: "Role",
        variant: "multiSelect",
        options: roleOptions,
        icon: Shield,
      },
      enableColumnFilter: true,
      enableSorting: false,
    },
    {
      id: "loyaltyTier",
      accessorFn: (row) => row.loyaltyTier?.name || "Chưa có",
      header: "Tier",
      cell: ({ row }) =>
        row.original.loyaltyTier ? (
          <Badge variant="secondary" className="whitespace-nowrap">
            <Award className="size-3" /> {row.original.loyaltyTier.name}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">Chưa có</span>
        ),
      meta: {
        label: "Tier",
        icon: Award,
      },
      enableSorting: false,
    },
    {
      id: "monetizationLevel",
      accessorFn: (row) => row.monetizationLevel?.name || "Chưa cấu hình",
      header: "Cấp kiếm tiền",
      cell: ({ row }) =>
        row.original.monetizationLevel ? (
          <div className="min-w-32">
            <p className="whitespace-nowrap font-medium text-sm">
              {row.original.monetizationLevel.name}
            </p>
            <p className="text-muted-foreground text-xs">
              {row.original.usesDefaultMonetizationLevel
                ? "Mặc định hệ thống"
                : "Gán riêng"}
            </p>
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">Chưa cấu hình</span>
        ),
      meta: {
        label: "Cấp kiếm tiền",
        icon: Zap,
      },
      enableSorting: false,
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Trạng thái" />
      ),
      cell: ({ row }) => <UserStatusBadge status={row.original.status} />,
      meta: {
        label: "Trạng thái",
        variant: "multiSelect",
        options: userStatusOptions,
        icon: CircleDashed,
      },
      enableColumnFilter: true,
    },
    {
      id: "balance",
      accessorKey: "balance",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Số dư" />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap font-medium tabular-nums">
          {formatBalance(row.original.balance)}
        </span>
      ),
      meta: {
        label: "Số dư",
        placeholder: "Lọc theo số dư...",
        variant: "number",
        icon: WalletCards,
      },
      enableColumnFilter: true,
    },
    {
      id: "activeSessionsCount",
      accessorKey: "activeSessionsCount",
      header: "Phiên",
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.activeSessionsCount}</span>
      ),
      enableSorting: false,
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
          {formatDate(row.original.createdAt, {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
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
          {formatDate(row.original.updatedAt, {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
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
      id: "actions",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={`Mở menu ${row.original.name}`}
              variant="ghost"
              className="flex size-8 p-0 data-[state=open]:bg-muted"
              onClick={(event) => event.stopPropagation()}
            >
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56"
            onClick={(event) => event.stopPropagation()}
          >
            <DropdownMenuItem asChild>
              <Link href={`/admin/users/${row.original.id}`}>
                <Eye /> Xem chi tiết
              </Link>
            </DropdownMenuItem>
            {canImpersonate &&
            row.original.id !== currentUserId &&
            row.original.status === "active" &&
            !row.original.permissions.includes("admin.access") ? (
              <DropdownMenuItem
                onSelect={() =>
                  setRowAction({ row, variant: "impersonate" })
                }
              >
                <LogIn /> Đăng nhập với tư cách user
              </DropdownMenuItem>
            ) : null}
            {canUpdate ? (
              <DropdownMenuItem asChild>
                <Link href={`/admin/users/${row.original.id}/edit`}>
                  <Pencil /> Chỉnh sửa
                </Link>
              </DropdownMenuItem>
            ) : null}
            {canManageStatus && row.original.id !== currentUserId ? (
              <>
                <DropdownMenuSeparator />
                {row.original.status === "active" ? (
                  <>
                    <DropdownMenuItem
                      onSelect={() => onStatusChange(row.original, "inactive")}
                    >
                      <Ban /> Vô hiệu hóa
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => onStatusChange(row.original, "locked")}
                    >
                      <LockKeyhole /> Khóa tài khoản
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem
                    onSelect={() => onStatusChange(row.original, "active")}
                  >
                    <CheckCircle2 /> Kích hoạt
                  </DropdownMenuItem>
                )}
              </>
            ) : null}
            {canRevokeSessions &&
            row.original.id !== currentUserId &&
            row.original.activeSessionsCount > 0 ? (
              <DropdownMenuItem
                onSelect={() =>
                  setRowAction({ row, variant: "revoke-sessions" })
                }
              >
                <KeyRound /> Thu hồi phiên đăng nhập
              </DropdownMenuItem>
            ) : null}
            {canDelete ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  disabled={row.original.id === currentUserId}
                  onSelect={() => setRowAction({ row, variant: "delete" })}
                >
                  <Trash2 /> Xóa người dùng
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
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

function formatBalance(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `$${value}`;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
