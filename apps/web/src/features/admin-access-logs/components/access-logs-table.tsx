"use client";

import * as React from "react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { useDataTable } from "@/hooks/use-data-table";

import type { AccessLogsTableQuery } from "../query/access-logs-search-params";
import type { AdminAccessLog, AdminAccessLogsResponse } from "../types";
import { AccessLogDetailSheet } from "./access-log-detail-sheet";
import { AccessLogsFilters } from "./access-logs-filters";
import { getAccessLogsColumns } from "./access-logs-table-columns";

export function AccessLogsTable({
  result,
  query,
}: {
  result: AdminAccessLogsResponse;
  query: AccessLogsTableQuery;
}) {
  const [selected, setSelected] = React.useState<AdminAccessLog | null>(null);
  const columns = React.useMemo(
    () => getAccessLogsColumns({ onView: setSelected }),
    [],
  );
  const { table } = useDataTable({
    data: result.items,
    columns,
    pageCount: result.pageCount,
    initialState: {
      columnVisibility: { country: false, deviceLabel: false, riskScore: false },
      columnPinning: { right: ["actions"] },
    },
    getRowId: (row) => row.id,
    shallow: false,
    clearOnDefault: true,
  });
  return <div className="space-y-4">
    <AccessLogsFilters query={query} />
    <div className="flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{new Intl.NumberFormat("vi-VN").format(result.total)} access log trong phạm vi đã chọn.</p><DataTableViewOptions table={table} /></div>
    <DataTable table={table} emptyMessage="Không có access log phù hợp với bộ lọc." />
    {selected ? <AccessLogDetailSheet log={selected} onOpenChange={(open) => !open && setSelected(null)} /> : null}
  </div>;
}
