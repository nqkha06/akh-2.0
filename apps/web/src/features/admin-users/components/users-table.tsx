"use client";

import type { Table } from "@tanstack/react-table";
import {
  Ban,
  CheckCircle2,
  LockKeyhole,
  Plus,
  Search,
  Shield,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar";
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import {
  updateAdminUsersStatus,
  updateAdminUserStatus,
} from "@/features/admin-users/api/users.client";
import {
  UserActionDialog,
  type UserConfirmationAction,
} from "@/features/admin-users/components/user-action-dialog";
import {
  getUsersTableColumns,
  type UserRowAction,
} from "@/features/admin-users/components/users-table-columns";
import type {
  AdminUserListItem,
  UserStatus,
  UsersAccessOptions,
  UsersTableData,
} from "@/features/admin-users/types";
import { useDataTable } from "@/hooks/use-data-table";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

export function UsersTable({
  data,
  pageCount,
  total,
  accessOptions,
}: UsersTableData & { accessOptions: UsersAccessOptions }) {
  const { data: session } = useSession();
  const currentUserId = Number(session?.user?.id || 0);
  const permissions = useAdminPermissions();
  const canCreate = permissions.includes("users.create");
  const canUpdate = permissions.includes("users.update");
  const canDelete = permissions.includes("users.delete");
  const canManageStatus = permissions.includes("users.manage-status");
  const canVerifyEmail = permissions.includes("users.verify-email");
  const canRevokeSessions = permissions.includes("users.revoke-sessions");
  const router = useRouter();
  const [rowAction, setRowAction] = React.useState<UserRowAction | null>(null);
  const [bulkDelete, setBulkDelete] = React.useState<AdminUserListItem[]>([]);
  const [mutatingId, setMutatingId] = React.useState<number | null>(null);

  const refresh = React.useCallback(
    (table?: Table<AdminUserListItem>) => {
      table?.toggleAllRowsSelected(false);
      router.refresh();
    },
    [router],
  );

  const changeOneStatus = React.useCallback(
    async (user: AdminUserListItem, status: UserStatus) => {
      setMutatingId(user.id);
      try {
        await updateAdminUserStatus(user.id, status);
        toast.success("Đã cập nhật trạng thái người dùng.");
        refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Không thể cập nhật trạng thái.",
        );
      } finally {
        setMutatingId(null);
      }
    },
    [refresh],
  );

  const columns = React.useMemo(
    () =>
      getUsersTableColumns({
        currentUserId,
        canDelete,
        canUpdate,
        canManageStatus,
        canVerifyEmail,
        canRevokeSessions,
        roleOptions: accessOptions.roles.map((role) => ({
          label: role.name,
          value: role.key,
          icon: role.key === "admin" ? Shield : UserRound,
        })),
        onStatusChange: (user, status) => {
          if (mutatingId === null) void changeOneStatus(user, status);
        },
        setRowAction,
      }),
    [
      accessOptions.roles,
      canDelete,
      canManageStatus,
      canRevokeSessions,
      canUpdate,
      canVerifyEmail,
      changeOneStatus,
      currentUserId,
      mutatingId,
    ],
  );

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data,
    columns,
    pageCount,
    enableAdvancedFilter: true,
    enableRowSelection: (row) => row.original.id !== currentUserId,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      columnVisibility: {
        email: false,
        updatedAt: false,
        activeSessionsCount: false,
      },
      columnPinning: { right: ["actions"] },
    },
    getRowId: (row) => String(row.id),
    shallow: false,
    clearOnDefault: true,
  });

  const confirmationAction = toConfirmationAction(rowAction, bulkDelete);

  return (
    <div className="flex min-w-0 w-full flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Identity registry
          </p>
          <h2 className="mt-1 text-lg font-semibold">Danh sách Users</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {total.toLocaleString("vi-VN")} tài khoản theo bộ lọc hiện tại.
          </p>
        </div>
        {canCreate ? (
          <Button asChild>
            <Link href="/admin/users/create">
              <Plus /> Tạo User
            </Link>
          </Button>
        ) : null}
      </div>

      <DataTable
        table={table}
        emptyMessage="Không tìm thấy người dùng phù hợp."
        actionBar={
          <UsersSelectionActionBar
            table={table}
            canManageStatus={canManageStatus}
            canDelete={canDelete}
            onDelete={setBulkDelete}
            onSuccess={() => refresh(table)}
          />
        }
      >
        <DataTableAdvancedToolbar table={table}>
          <UsersSearchInput />
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

      <UserActionDialog
        action={confirmationAction}
        onOpenChange={() => {
          setRowAction(null);
          setBulkDelete([]);
        }}
        onSuccess={() => refresh(table)}
      />
    </div>
  );
}

function UsersSearchInput() {
  const [search, setSearch] = useQueryState(
    "name",
    parseAsString.withDefault("").withOptions({
      shallow: false,
      clearOnDefault: true,
    }),
  );
  const [, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions({
      shallow: false,
      clearOnDefault: true,
    }),
  );
  const commit = useDebouncedCallback((next: string) => {
    void setPage(1);
    void setSearch(next || null);
  }, 300);

  return (
    <div className="relative min-w-52 flex-1 sm:max-w-xs">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        key={search}
        defaultValue={search}
        onChange={(event) => commit(event.target.value.trim())}
        className="pr-8 pl-8"
        placeholder="Tìm tên hoặc email..."
        aria-label="Tìm người dùng"
      />
      {search ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-1/2 right-0.5 -translate-y-1/2"
          aria-label="Xóa tìm kiếm"
          onClick={() => {
            void setPage(1);
            void setSearch(null);
          }}
        >
          <X />
        </Button>
      ) : null}
    </div>
  );
}

function UsersSelectionActionBar({
  table,
  canManageStatus,
  canDelete,
  onDelete,
  onSuccess,
}: {
  table: Table<AdminUserListItem>;
  canManageStatus: boolean;
  canDelete: boolean;
  onDelete: (users: AdminUserListItem[]) => void;
  onSuccess: () => void;
}) {
  const [mutating, setMutating] = React.useState(false);
  const selected = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original);

  async function changeStatus(status: UserStatus) {
    setMutating(true);
    try {
      const result = await updateAdminUsersStatus(
        selected.map((user) => user.id),
        status,
      );
      toast.success(`Đã cập nhật ${result.updated} người dùng.`);
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật trạng thái.",
      );
    } finally {
      setMutating(false);
    }
  }

  return (
    <div
      role="toolbar"
      className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card p-2 shadow-sm"
    >
      <span className="px-1 text-sm">
        <strong>{selected.length}</strong> người dùng đã chọn
      </span>
      <div className="flex flex-wrap items-center gap-1">
        {canManageStatus ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              disabled={mutating}
              onClick={() => void changeStatus("active")}
            >
              <CheckCircle2 /> Kích hoạt
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={mutating}
              onClick={() => void changeStatus("inactive")}
            >
              <Ban /> Vô hiệu hóa
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={mutating}
              onClick={() => void changeStatus("locked")}
            >
              <LockKeyhole /> Khóa
            </Button>
          </>
        ) : null}
        {canDelete ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            disabled={mutating}
            onClick={() => onDelete(selected)}
          >
            <Trash2 /> Xóa
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          disabled={mutating}
          onClick={() => table.toggleAllRowsSelected(false)}
        >
          <X /> Bỏ chọn
        </Button>
      </div>
    </div>
  );
}

function toConfirmationAction(
  rowAction: UserRowAction | null,
  bulkDelete: AdminUserListItem[],
): UserConfirmationAction | null {
  if (bulkDelete.length) return { type: "delete", users: bulkDelete };
  if (!rowAction) return null;
  if (rowAction.variant === "delete") {
    return { type: "delete", users: [rowAction.row.original] };
  }
  return {
    type: rowAction.variant,
    users: [rowAction.row.original],
  };
}
