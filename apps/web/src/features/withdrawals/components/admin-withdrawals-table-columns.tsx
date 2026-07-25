"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  CalendarDays,
  CircleDashed,
  CircleDollarSign,
  Clock3,
  Ellipsis,
  Eye,
  Landmark,
  Mail,
  UserRound,
  XCircle,
} from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AdminWithdrawal,
  WithdrawalStatus,
} from "@/features/withdrawals/types";
import {
  formatWithdrawalDate,
  formatWithdrawalMoney,
  getAllowedWithdrawalStatuses,
  getWithdrawalStatusOption,
  withdrawalStatusOptions,
} from "@/features/withdrawals/withdrawal-status";
import { cn } from "@/lib/utils";

export function getAdminWithdrawalsTableColumns({
  canProcess,
  busyId,
  onStatusChange,
  onView,
  onReject,
}: {
  canProcess: boolean;
  busyId: number | null;
  onStatusChange: (
    withdrawal: AdminWithdrawal,
    status: WithdrawalStatus,
  ) => void;
  onView: (withdrawal: AdminWithdrawal) => void;
  onReject: (withdrawal: AdminWithdrawal) => void;
}): ColumnDef<AdminWithdrawal>[] {
  return [
    {
      id: "id",
      accessorKey: "id",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Mã" />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          #{row.original.id}
        </span>
      ),
      size: 72,
    },
    {
      id: "member",
      accessorFn: (row) => `${row.user.name} ${row.user.email}`,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Member" />
      ),
      cell: ({ row }) => (
        <div className="flex min-w-60 items-center gap-3">
          <Avatar className="rounded-lg border">
            <AvatarFallback className="rounded-lg text-xs">
              {initials(row.original.user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {row.original.user.name}
            </p>
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <Mail className="size-3" />
              {row.original.user.email}
            </p>
          </div>
        </div>
      ),
      meta: {
        label: "Member",
        placeholder: "Tên, email hoặc mã...",
        variant: "text",
        icon: UserRound,
      },
      enableColumnFilter: true,
      enableSorting: false,
    },
    {
      id: "paymentMethod",
      accessorFn: (row) => row.paymentMethod.name,
      header: "Phương thức",
      cell: ({ row }) => (
        <div className="flex min-w-36 items-center gap-2 text-sm">
          <Landmark className="size-4 text-muted-foreground" />
          <span className="truncate">{row.original.paymentMethod.name}</span>
        </div>
      ),
      enableSorting: false,
    },
    {
      id: "amount",
      accessorKey: "amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Yêu cầu" />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap font-medium tabular-nums">
          {formatWithdrawalMoney(row.original.amount, row.original.currency)}
        </span>
      ),
    },
    {
      id: "netAmount",
      accessorKey: "netAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Thực nhận" />
      ),
      cell: ({ row }) => (
        <div className="whitespace-nowrap tabular-nums">
          <p className="font-medium">
            {formatWithdrawalMoney(
              row.original.netAmount,
              row.original.currency,
            )}
          </p>
          {Number(row.original.feeAmount) > 0 ? (
            <p className="text-xs text-muted-foreground">
              Phí{" "}
              {formatWithdrawalMoney(
                row.original.feeAmount,
                row.original.currency,
              )}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Trạng thái" />
      ),
      cell: ({ row }) => (
        <WithdrawalStatusCell
          withdrawal={row.original}
          canProcess={canProcess}
          busy={busyId === row.original.id}
          onStatusChange={onStatusChange}
        />
      ),
      meta: {
        label: "Trạng thái",
        variant: "multiSelect",
        options: withdrawalStatusOptions.map(({ label, value }) => ({
          label,
          value,
        })),
        icon: CircleDashed,
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
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {formatWithdrawalDate(row.original.createdAt)}
        </span>
      ),
      meta: {
        label: "Ngày tạo",
        icon: CalendarDays,
      },
    },
    {
      id: "processedAt",
      accessorKey: "processedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Đã xử lý" />
      ),
      cell: ({ row }) => (
        <div className="min-w-32 text-xs">
          <p className="whitespace-nowrap text-muted-foreground">
            {formatWithdrawalDate(row.original.processedAt)}
          </p>
          {row.original.processedBy ? (
            <p className="mt-0.5 truncate">{row.original.processedBy.name}</p>
          ) : null}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Thao tác",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => {
        const canTransition =
          canProcess &&
          (row.original.status === "pending" ||
            row.original.status === "processing");

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label={`Mở thao tác yêu cầu #${row.original.id}`}
                variant="ghost"
                className="flex size-8 p-0 data-[state=open]:bg-muted"
              >
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onSelect={() => onView(row.original)}
              >
                <Eye /> Xem chi tiết
              </DropdownMenuItem>
              {canTransition ? <DropdownMenuSeparator /> : null}
              {row.original.status === "pending" && canProcess ? (
                <DropdownMenuItem
                  disabled={busyId === row.original.id}
                  onSelect={() => onStatusChange(row.original, "processing")}
                >
                  <Clock3 /> Tiếp nhận xử lý
                </DropdownMenuItem>
              ) : null}
              {row.original.status === "processing" && canProcess ? (
                <DropdownMenuItem
                  disabled={busyId === row.original.id}
                  onSelect={() => onStatusChange(row.original, "paid")}
                >
                  <CircleDollarSign /> Xác nhận đã thanh toán
                </DropdownMenuItem>
              ) : null}
              {canTransition ? (
                <DropdownMenuItem
                  variant="destructive"
                  disabled={busyId === row.original.id}
                  onSelect={() => onReject(row.original)}
                >
                  <XCircle /> Từ chối và hoàn số dư
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 72,
    },
  ];
}

function WithdrawalStatusCell({
  withdrawal,
  canProcess,
  busy,
  onStatusChange,
}: {
  withdrawal: AdminWithdrawal;
  canProcess: boolean;
  busy: boolean;
  onStatusChange: (
    withdrawal: AdminWithdrawal,
    status: WithdrawalStatus,
  ) => void;
}) {
  const current = getWithdrawalStatusOption(withdrawal.status);
  const allowedStatuses = getAllowedWithdrawalStatuses(withdrawal.status);
  const editable = canProcess && allowedStatuses.length > 1;

  if (!editable) {
    return (
      <Badge
        variant="outline"
        className={cn("whitespace-nowrap font-medium", current.badgeClassName)}
      >
        <span className={cn("size-1.5 rounded-full", current.dotClassName)} />
        {current.label}
      </Badge>
    );
  }

  return (
    <Select
      value={withdrawal.status}
      disabled={busy}
      onValueChange={(value) =>
        onStatusChange(withdrawal, value as WithdrawalStatus)
      }
    >
      <SelectTrigger
        size="sm"
        aria-label={`Trạng thái yêu cầu #${withdrawal.id}`}
        className="min-w-40"
      >
        <SelectValue>
          <span className={cn("size-2 rounded-full", current.dotClassName)} />
          {busy ? "Đang cập nhật..." : current.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {withdrawalStatusOptions
          .filter((option) => allowedStatuses.includes(option.value))
          .map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <span
                className={cn("size-2 rounded-full", option.dotClassName)}
              />
              {option.label}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
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
