"use client";

import type { Table } from "@tanstack/react-table";
import { Plus, Shield, UserRound, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar";
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { Button } from "@/components/ui/button";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import { DeleteUserDialog } from "@/features/admin-users/components/delete-user-dialog";
import { UserEditorDialog } from "@/features/admin-users/components/user-editor-dialog";
import { getUsersTableColumns } from "@/features/admin-users/components/users-table-columns";
import type {
  AdminUser,
  UsersAccessOptions,
  UsersTableData,
} from "@/features/admin-users/types";
import { useDataTable } from "@/hooks/use-data-table";
import type { DataTableRowAction } from "@/types/data-table";

export function UsersTable({
  data,
  pageCount,
  accessOptions,
}: UsersTableData & { accessOptions: UsersAccessOptions }) {
  const { data: session } = useSession();
  const permissions = useAdminPermissions();
  const canCreate = permissions.includes("users.create");
  const canUpdate = permissions.includes("users.update");
  const canDelete = permissions.includes("users.delete");
  const router = useRouter();
  const currentUserId = Number(session?.user?.id || 0);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<AdminUser> | null>(null);

  const columns = React.useMemo(
    () =>
      getUsersTableColumns({
        currentUserId,
        canDelete,
        canUpdate,
        roleOptions: accessOptions.roles.map((role) => ({
          label: role.name,
          value: role.key,
          icon: role.key === "admin" ? Shield : UserRound,
        })),
        setRowAction,
      }),
    [accessOptions.roles, canDelete, canUpdate, currentUserId],
  );

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data,
    columns,
    pageCount,
    enableAdvancedFilter: true,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      columnVisibility: { email: false },
      columnPinning: { right: ["actions"] },
    },
    getRowId: (row) => String(row.id),
    shallow: false,
    clearOnDefault: true,
  });

  const refresh = React.useCallback(() => {
    table.toggleAllRowsSelected(false);
    router.refresh();
  }, [router, table]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h2 className="mt-2 font-semibold text-2xl tracking-[-0.6px]">
            Người dùng
          </h2>
        {canCreate ? (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> Thêm người dùng
          </Button>
        ) : null}
      </div>

      <DataTable table={table} actionBar={<UsersSelectionActionBar table={table} />}>
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

      {createOpen ? (
        <UserEditorDialog
          open
          user={null}
          accessOptions={accessOptions}
          currentUserId={currentUserId}
          onOpenChange={setCreateOpen}
          onSuccess={refresh}
        />
      ) : null}
      {rowAction?.variant === "update" ? (
        <UserEditorDialog
          key={rowAction.row.original.id}
          open
          user={rowAction.row.original}
          accessOptions={accessOptions}
          currentUserId={currentUserId}
          onOpenChange={() => setRowAction(null)}
          onSuccess={refresh}
        />
      ) : null}
      <DeleteUserDialog
        user={rowAction?.variant === "delete" ? rowAction.row.original : null}
        onOpenChange={() => setRowAction(null)}
        onSuccess={refresh}
      />
    </div>
  );
}

function UsersSelectionActionBar({ table }: { table: Table<AdminUser> }) {
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div
      role="toolbar"
      className="flex items-center justify-between gap-3 rounded-md border bg-card p-2 shadow-sm"
    >
      <span className="text-sm">
        <strong>{selectedCount}</strong> người dùng đã chọn
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => table.toggleAllRowsSelected(false)}
      >
        <X /> Bỏ chọn
      </Button>
    </div>
  );
}
