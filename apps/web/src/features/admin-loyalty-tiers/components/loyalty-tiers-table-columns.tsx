"use client";

import type { ColumnDef, Row } from "@tanstack/react-table";
import {
  CalendarDays,
  Check,
  CircleDashed,
  Copy,
  Ellipsis,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoyaltyTierIcon } from "@/features/admin-loyalty-tiers/components/loyalty-tier-icon";
import type { AdminLoyaltyTier } from "@/features/admin-loyalty-tiers/types";
import { publicationStatusOptions } from "@/types/publication-status";

export type LoyaltyTierRowAction = {
  row: Row<AdminLoyaltyTier>;
  variant: "delete";
};

export function getLoyaltyTiersTableColumns({
  locale,
  canUpdate,
  canCreate,
  canDelete,
  onEdit,
  onDuplicate,
  setRowAction,
}: {
  locale: string;
  canUpdate: boolean;
  canCreate: boolean;
  canDelete: boolean;
  onEdit: (id: number) => void;
  onDuplicate: (id: number) => void;
  setRowAction: React.Dispatch<React.SetStateAction<LoyaltyTierRowAction | null>>;
}): ColumnDef<AdminLoyaltyTier>[] {
  return [
    {
      id: "key",
      accessorKey: "key",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Hạng Loyalty" />
      ),
      cell: ({ row }) => (
        <div className="flex min-w-60 items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-md border bg-primary/5">
            <LoyaltyTierIcon
              iconKey={row.original.iconKey}
              className="size-4 text-primary"
            />
          </div>
          <div className="min-w-0">
            {canUpdate ? (
              <button
                type="button"
                className="truncate text-left text-sm font-medium hover:text-primary hover:underline hover:underline-offset-4"
                onClick={() => onEdit(row.original.id)}
              >
                {localizedTierName(row.original, locale)}
              </button>
            ) : (
              <p className="truncate text-sm font-medium">
                {localizedTierName(row.original, locale)}
              </p>
            )}
            <p className="truncate font-mono text-xs text-muted-foreground">
              {row.original.key}
            </p>
          </div>
        </div>
      ),
      meta: {
        label: "Tên hoặc key",
        placeholder: "Tìm hạng Loyalty...",
        variant: "text",
        icon: Eye,
      },
      enableColumnFilter: true,
    },
    {
      id: "minimumValidViews",
      accessorKey: "minimumValidViews",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Ngưỡng 7 ngày" />
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap font-medium tabular-nums">
          {row.original.minimumValidViews.toLocaleString("vi-VN")} lượt
        </span>
      ),
    },
    {
      id: "benefits",
      accessorFn: (row) => row.benefitsCount,
      header: "Quyền lợi",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm tabular-nums">
          <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
          <span>
            {row.original.includedBenefitsCount}/{row.original.benefitsCount}
          </span>
        </div>
      ),
      enableSorting: false,
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
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Trạng thái" />
      ),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      meta: {
        label: "Trạng thái",
        variant: "multiSelect",
        options: publicationStatusOptions.map(({ label, value }) => ({
          label,
          value,
        })),
        icon: CircleDashed,
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
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {new Intl.DateTimeFormat("vi-VN", {
            dateStyle: "short",
            timeStyle: "short",
          }).format(new Date(row.original.updatedAt))}
        </span>
      ),
      meta: { label: "Cập nhật", variant: "dateRange", icon: CalendarDays },
    },
    {
      id: "actions",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) =>
        canUpdate || canCreate || canDelete ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label={`Mở menu ${localizedTierName(row.original, locale)}`}
                variant="ghost"
                className="flex size-8 p-0 data-[state=open]:bg-muted"
              >
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {canUpdate ? (
                <DropdownMenuItem onSelect={() => onEdit(row.original.id)}>
                  <Pencil /> Chỉnh sửa
                </DropdownMenuItem>
              ) : null}
              {canCreate ? (
                <DropdownMenuItem onSelect={() => onDuplicate(row.original.id)}>
                  <Copy /> Nhân bản
                </DropdownMenuItem>
              ) : null}
              {(canUpdate || canCreate) && canDelete ? (
                <DropdownMenuSeparator />
              ) : null}
              {canDelete ? (
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setRowAction({ row, variant: "delete" })}
                >
                  <Trash2 /> Xóa
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null,
    },
  ];
}

function localizedTierName(tier: AdminLoyaltyTier, locale: string) {
  const normalized = locale.toLowerCase();
  return (
    tier.translations.find(
      (translation) => translation.locale.toLowerCase() === normalized,
    )?.name ??
    tier.translations.find(
      (translation) =>
        translation.locale.toLowerCase() === normalized.split("-")[0],
    )?.name ??
    tier.translations.find((translation) => translation.locale === "vi")?.name ??
    tier.translations.find((translation) => translation.locale === "en")?.name ??
    tier.displayName ??
    tier.key
  );
}

function StatusBadge({ status }: { status: AdminLoyaltyTier["status"] }) {
  if (status === "published") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Xuất bản</Badge>;
  }
  if (status === "pending") return <Badge variant="secondary">Chờ xử lý</Badge>;
  return <Badge variant="outline">Nháp</Badge>;
}
