"use client";

import { RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { Button } from "@/components/ui/button";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import {
  getAdminWithdrawalsTableColumns,
} from "@/features/withdrawals/components/admin-withdrawals-table-columns";
import { RejectWithdrawalDialog } from "@/features/withdrawals/components/reject-withdrawal-dialog";
import { WithdrawalDetailSheet } from "@/features/withdrawals/components/withdrawal-detail-sheet";
import {
  markAdminWithdrawalPaid,
  processAdminWithdrawal,
} from "@/features/withdrawals/api/withdrawals.client";
import type {
  AdminWithdrawal,
  AdminWithdrawalsTableData,
  WithdrawalStatus,
} from "@/features/withdrawals/types";
import { useDataTable } from "@/hooks/use-data-table";

export function AdminWithdrawalsTable({
  data,
  pageCount,
  total,
}: AdminWithdrawalsTableData) {
  const permissions = useAdminPermissions();
  const canProcess = permissions.includes("withdrawals.process");
  const router = useRouter();
  const [isRefreshing, startRefreshing] = React.useTransition();
  const [busyId, setBusyId] = React.useState<number | null>(null);
  const [detailTarget, setDetailTarget] =
    React.useState<AdminWithdrawal | null>(null);
  const [rejectTarget, setRejectTarget] =
    React.useState<AdminWithdrawal | null>(null);

  const refresh = React.useCallback(() => {
    startRefreshing(() => router.refresh());
  }, [router]);

  const changeStatus = React.useCallback(
    async (withdrawal: AdminWithdrawal, status: WithdrawalStatus) => {
      if (status === withdrawal.status) return;
      if (status === "rejected") {
        setRejectTarget(withdrawal);
        return;
      }

      const operation =
        status === "processing"
          ? processAdminWithdrawal
          : status === "paid"
            ? markAdminWithdrawalPaid
            : null;

      if (!operation) return;

      try {
        setBusyId(withdrawal.id);
        await operation(withdrawal.id);
        toast.success(
          status === "processing"
            ? "Đã tiếp nhận xử lý yêu cầu."
            : "Đã xác nhận thanh toán thành công.",
        );
        refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Không thể cập nhật trạng thái yêu cầu.",
        );
      } finally {
        setBusyId(null);
      }
    },
    [refresh],
  );

  const columns = React.useMemo(
    () =>
      getAdminWithdrawalsTableColumns({
        canProcess,
        busyId,
        onStatusChange: (withdrawal, status) => {
          void changeStatus(withdrawal, status);
        },
        onView: setDetailTarget,
        onReject: setRejectTarget,
      }),
    [busyId, canProcess, changeStatus],
  );

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    getRowId: (row) => String(row.id),
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Withdrawal registry
          </p>
          <div className="mt-1 flex items-center gap-2">
            <h2 className="text-lg font-semibold">Danh sách yêu cầu</h2>
            <span className="rounded-full border bg-muted/30 px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
              {total.toLocaleString("vi-VN")}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Chỉnh trạng thái ngay trong bảng hoặc mở menu thao tác của từng yêu
            cầu.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={refresh}
          disabled={isRefreshing}
        >
          <RefreshCcw className={isRefreshing ? "animate-spin" : undefined} />
          Làm mới
        </Button>
      </div>

      <DataTable
        table={table}
        emptyMessage="Chưa có yêu cầu rút tiền phù hợp."
      >
        <DataTableToolbar table={table}>
          <DataTableSortList
            table={table}
            align="end"
          />
        </DataTableToolbar>
      </DataTable>

      {detailTarget ? (
        <WithdrawalDetailSheet
          key={detailTarget.id}
          withdrawal={detailTarget}
          onOpenChange={(open) => {
            if (!open) setDetailTarget(null);
          }}
        />
      ) : null}
      {rejectTarget ? (
        <RejectWithdrawalDialog
          key={rejectTarget.id}
          withdrawal={rejectTarget}
          onOpenChange={(open) => {
            if (!open) setRejectTarget(null);
          }}
          onSuccess={refresh}
        />
      ) : null}
    </div>
  );
}
