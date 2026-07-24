"use client";

import type { Table } from "@tanstack/react-table";
import {
  Archive,
  RotateCcw,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
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
  updateAdminPageStatus,
  updateAdminPagesStatus,
} from "@/features/admin-pages/api/pages.client";
import { PageDeleteDialog } from "@/features/admin-pages/components/page-delete-dialog";
import {
  getPagesTableColumns,
  type PageRowAction,
} from "@/features/admin-pages/components/pages-table-columns";
import type {
  AdminPageListItem,
  AdminPagesTableData,
  PageStatus,
} from "@/features/admin-pages/types";
import { useDataTable } from "@/hooks/use-data-table";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

export function PagesTable({
  data,
  pageCount,
}: AdminPagesTableData) {
  const permissions = useAdminPermissions();
  const canUpdate = permissions.includes("pages.update");
  const canDelete = permissions.includes("pages.delete");
  const canPublish = permissions.includes("pages.publish");
  const router = useRouter();
  const [rowAction, setRowAction] = React.useState<PageRowAction | null>(null);
  const [deletePages, setDeletePages] = React.useState<AdminPageListItem[]>([]);
  const [mutatingId, setMutatingId] = React.useState<number | null>(null);

  const refresh = React.useCallback(
    (table?: Table<AdminPageListItem>) => {
      table?.toggleAllRowsSelected(false);
      router.refresh();
    },
    [router],
  );

  const changeOneStatus = React.useCallback(
    async (page: AdminPageListItem, status: PageStatus) => {
      setMutatingId(page.id);
      try {
        await updateAdminPageStatus(page.id, status);
        toast.success("Đã cập nhật trạng thái trang.");
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
      getPagesTableColumns({
        canUpdate,
        canDelete,
        canPublish,
        onStatusChange: (page, status) => {
          if (mutatingId === null) void changeOneStatus(page, status);
        },
        setRowAction,
      }),
    [
      canDelete,
      canPublish,
      canUpdate,
      changeOneStatus,
      mutatingId,
    ],
  );

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data,
    columns,
    pageCount,
    enableAdvancedFilter: true,
    initialState: {
      sorting: [{ id: "updatedAt", desc: true }],
      columnVisibility: { slug: false, createdAt: false, sortOrder: false },
      columnPinning: { right: ["actions"] },
    },
    getRowId: (row) => String(row.id),
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <div className="flex min-w-0 w-full flex-col gap-6">
      <DataTable
        table={table}
        emptyMessage="Không tìm thấy trang phù hợp."
        actionBar={
          <PagesSelectionActionBar
            table={table}
            canUpdate={canUpdate}
            canDelete={canDelete}
            canPublish={canPublish}
            onDelete={setDeletePages}
            onSuccess={() => refresh(table)}
          />
        }
      >
        <DataTableAdvancedToolbar table={table}>
          <PagesSearchInput />
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

      <PageDeleteDialog
        pages={
          rowAction?.variant === "delete"
            ? [rowAction.row.original]
            : deletePages
        }
        onOpenChange={() => {
          setRowAction(null);
          setDeletePages([]);
        }}
        onSuccess={() => refresh(table)}
      />
    </div>
  );
}

function PagesSearchInput() {
  const [search, setSearch] = useQueryState(
    "search",
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
        onChange={(event) => {
          commit(event.target.value.trim());
        }}
        className="pr-8 pl-8"
        placeholder="Tìm title hoặc slug..."
        aria-label="Tìm Pages"
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

function PagesSelectionActionBar({
  table,
  canUpdate,
  canDelete,
  canPublish,
  onDelete,
  onSuccess,
}: {
  table: Table<AdminPageListItem>;
  canUpdate: boolean;
  canDelete: boolean;
  canPublish: boolean;
  onDelete: (pages: AdminPageListItem[]) => void;
  onSuccess: () => void;
}) {
  const [mutating, setMutating] = React.useState(false);
  const selected = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original);
  const allDraft = selected.every((page) => page.status === "DRAFT");
  const allPublished = selected.every((page) => page.status === "PUBLISHED");
  const allArchived = selected.every((page) => page.status === "ARCHIVED");

  async function changeStatus(status: PageStatus) {
    setMutating(true);
    try {
      const result = await updateAdminPagesStatus(
        selected.map((page) => page.id),
        status,
      );
      toast.success(`Đã cập nhật ${result.updated} trang.`);
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
        <strong>{selected.length}</strong> trang đã chọn
      </span>
      <div className="flex flex-wrap items-center gap-1">
        {canUpdate && canPublish && allDraft ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={mutating}
            onClick={() => void changeStatus("PUBLISHED")}
          >
            <Send /> Xuất bản
          </Button>
        ) : null}
        {canUpdate && allPublished ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={mutating}
            onClick={() => void changeStatus("DRAFT")}
          >
            <RotateCcw /> Về nháp
          </Button>
        ) : null}
        {canUpdate && !allArchived ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={mutating}
            onClick={() => void changeStatus("ARCHIVED")}
          >
            <Archive /> Lưu trữ
          </Button>
        ) : null}
        {canUpdate && allArchived ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={mutating}
            onClick={() => void changeStatus("DRAFT")}
          >
            <RotateCcw /> Khôi phục về nháp
          </Button>
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
