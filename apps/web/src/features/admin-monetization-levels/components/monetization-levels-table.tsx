"use client";

import { Activity, Globe2, Layers3, Route, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import * as React from "react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar";
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import { DeleteMonetizationLevelDialog } from "@/features/admin-monetization-levels/components/delete-monetization-level-dialog";
import {
  getMonetizationLevelsTableColumns,
  type MonetizationLevelRowAction,
} from "@/features/admin-monetization-levels/components/monetization-levels-table-columns";
import type { MonetizationLevelsTableData } from "@/features/admin-monetization-levels/types";
import { useDataTable } from "@/hooks/use-data-table";

export function MonetizationLevelsTable({
  data,
  pageCount,
  total,
  summary,
}: MonetizationLevelsTableData) {
  const permissions = useAdminPermissions();
  const locale = useLocale();
  const canUpdate = permissions.includes("monetization-levels.update");
  const canDelete = permissions.includes("monetization-levels.delete");
  const router = useRouter();
  const [rowAction, setRowAction] =
    React.useState<MonetizationLevelRowAction | null>(null);
  const columns = React.useMemo(
    () =>
      getMonetizationLevelsTableColumns({
        locale,
        canUpdate,
        canDelete,
        onEdit: (id) => router.push(`/admin/monetization-levels/${id}/edit`),
        onDuplicate: (id) =>
          router.push(`/admin/monetization-levels/create?from=${id}`),
        setRowAction,
      }),
    [canDelete, canUpdate, locale, router],
  );
  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data,
    columns,
    pageCount,
    enableAdvancedFilter: true,
    initialState: {
      sorting: [{ id: "sortOrder", desc: false }],
      columnPinning: { right: ["actions"] },
    },
    getRowId: (row) => String(row.id),
    shallow: false,
    clearOnDefault: true,
  });
  const refresh = React.useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          icon={Layers3}
          label="Tổng cấp độ"
          value={total}
          description="Theo bộ lọc hiện tại"
        />
        <SummaryCard
          icon={Activity}
          label="Đã xuất bản"
          value={summary.publishedLevels}
          description="Có thể gán cho link"
        />
        <SummaryCard
          icon={Route}
          label="Direct routes"
          value={summary.configuredRoutes}
          description="Toàn bộ kết quả"
        />
        <SummaryCard
          icon={Globe2}
          label="Country rates"
          value={summary.configuredRates}
          description="Toàn bộ kết quả"
        />
        <SummaryCard
          icon={Users}
          label="Người dùng"
          value={summary.assignedUsers}
          description="Đã lựa chọn level"
        />
      </div>

      <DataTable table={table}>
        <DataTableAdvancedToolbar table={table}>
          <DataTableFilterList
            table={table}
            shallow={shallow}
            debounceMs={debounceMs}
            throttleMs={throttleMs}
            align="start"
          />
          <DataTableSortList table={table} align="start" />
        </DataTableAdvancedToolbar>
      </DataTable>

      <DeleteMonetizationLevelDialog
        level={rowAction?.row.original ?? null}
        onOpenChange={() => setRowAction(null)}
        onSuccess={refresh}
      />
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] tabular-nums">
        {value.toLocaleString("vi-VN")}
      </p>
      <p className="mt-1 truncate text-[11px] text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
