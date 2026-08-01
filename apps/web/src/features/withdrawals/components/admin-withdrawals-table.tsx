"use client";

import { X } from "lucide-react";
import Link from "next/link";
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
  filteredUserId,
}: AdminWithdrawalsTableData & { filteredUserId: number | null }) {
  const permissions = useAdminPermissions();
  const canProcess = permissions.includes("withdrawals.process");
  const router = useRouter();
  const [busyId, setBusyId] = React.useState<number | null>(null);
  const [detailTarget, setDetailTarget] =
    React.useState<AdminWithdrawal | null>(null);
  const [rejectTarget, setRejectTarget] =
    React.useState<AdminWithdrawal | null>(null);

  const refresh = React.useCallback(() => {
    router.refresh();
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
      {filteredUserId ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3">
          <p className="text-sm">
            Đang hiển thị yêu cầu rút tiền của người dùng #{filteredUserId}.
          </p>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/withdrawals">
              <X /> Bỏ lọc người dùng
            </Link>
          </Button>
        </div>
      ) : null}

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
