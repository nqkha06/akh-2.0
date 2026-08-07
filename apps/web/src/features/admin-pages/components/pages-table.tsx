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
import { PageStatusDialog } from "@/features/admin-pages/components/page-status-dialog";
import {
  getPagesTableColumns,
  type PageRowAction,
} from "@/features/admin-pages/components/pages-table-columns";
import type {
  AdminPageListItem,
  AdminPagesTableData,
  PageStatus,
} from "@/features/admin-pages/types";
import { copyPublicPageUrl } from "@/features/pages/public-page-url";
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
  const [statusAction, setStatusAction] = React.useState<{
    pages: AdminPageListItem[];
    status: PageStatus;
  } | null>(null);
  const [statusBusy, setStatusBusy] = React.useState(false);

  const refresh = React.useCallback(
    (table?: Table<AdminPageListItem>) => {
      table?.toggleAllRowsSelected(false);
      router.refresh();
    },
    [router],
  );

  const copyPublicUrl = React.useCallback((page: AdminPageListItem) => {
    void copyPublicPageUrl(page.slug).then(
      () => toast.success("Đã sao chép URL public."),
      () => toast.error("Không thể sao chép URL public."),
    );
  }, []);

  const columns = React.useMemo(
    () =>
      getPagesTableColumns({
        canUpdate,
        canDelete,
        canPublish,
        onCopyPublicUrl: copyPublicUrl,
        onStatusChange: (page, status) => {
          setStatusAction({ pages: [page], status });
        },
        setRowAction,
      }),
    [
      canDelete,
      canPublish,
      canUpdate,
      copyPublicUrl,
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

  async function confirmStatusChange() {
    if (!statusAction) return;
    setStatusBusy(true);
    try {
      const { pages, status } = statusAction;
      if (pages.length === 1) {
        await updateAdminPageStatus(pages[0]!.id, status);
      } else {
        await updateAdminPagesStatus(
          pages.map((page) => page.id),
          status,
        );
      }
      toast.success(`Đã cập nhật ${pages.length} trang.`);
      setStatusAction(null);
      refresh(table);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật trạng thái.",
      );
    } finally {
      setStatusBusy(false);
    }
  }

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
            onStatusChange={(pages, status) =>
              setStatusAction({ pages, status })
            }
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
      <PageStatusDialog
        count={statusAction?.pages.length ?? 0}
        status={statusAction?.status ?? null}
        busy={statusBusy}
        onConfirm={() => void confirmStatusChange()}
        onOpenChange={(open) => {
          if (!open) setStatusAction(null);
        }}
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
  onStatusChange,
}: {
  table: Table<AdminPageListItem>;
  canUpdate: boolean;
  canDelete: boolean;
  canPublish: boolean;
  onDelete: (pages: AdminPageListItem[]) => void;
  onStatusChange: (pages: AdminPageListItem[], status: PageStatus) => void;
}) {
  const selected = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original);
  const allDraft = selected.every((page) => page.status === "DRAFT");
  const allPublished = selected.every((page) => page.status === "PUBLISHED");
  const allArchived = selected.every((page) => page.status === "ARCHIVED");

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
            onClick={() => onStatusChange(selected, "PUBLISHED")}
          >
            <Send /> Xuất bản
          </Button>
        ) : null}
        {canUpdate && allPublished ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStatusChange(selected, "DRAFT")}
          >
            <RotateCcw /> Về nháp
          </Button>
        ) : null}
        {canUpdate && !allArchived ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStatusChange(selected, "ARCHIVED")}
          >
            <Archive /> Lưu trữ
          </Button>
        ) : null}
        {canUpdate && allArchived ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStatusChange(selected, "DRAFT")}
          >
            <RotateCcw /> Khôi phục về nháp
          </Button>
        ) : null}
        {canDelete ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(selected)}
          >
            <Trash2 /> Xóa
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => table.toggleAllRowsSelected(false)}
        >
          <X /> Bỏ chọn
        </Button>
      </div>
    </div>
  );
}
