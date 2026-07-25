"use client"

import type { Table } from "@tanstack/react-table"
import {
  CirclePause,
  CirclePlay,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar"
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list"
import { DataTableSortList } from "@/components/data-table/data-table-sort-list"
import { Button } from "@/components/ui/button"
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider"
import {
  restoreAdminSocialLinks,
  updateAdminSocialLinksStatus,
} from "@/features/admin-social-links/api/social-links.client"
import { DeleteSocialLinksDialog } from "@/features/admin-social-links/components/delete-social-links-dialog"
import { RestoreSocialLinksDialog } from "@/features/admin-social-links/components/restore-social-links-dialog"
import { SocialLinkEditorDialog } from "@/features/admin-social-links/components/social-link-editor-dialog"
import {
  getSocialLinksTableColumns,
  type SocialLinkRowAction,
} from "@/features/admin-social-links/components/social-links-table-columns"
import type {
  AdminSocialLink,
  AdminSocialLinksTableData,
  AdminSocialLinkStatus,
} from "@/features/admin-social-links/types"
import { useDataTable } from "@/hooks/use-data-table"

export function SocialLinksTable({
  data,
  pageCount,
  total,
  totalViews,
}: AdminSocialLinksTableData) {
  const permissions = useAdminPermissions()
  const canUpdate = permissions.includes("links.update")
  const canDelete = permissions.includes("links.delete")
  const router = useRouter()
  const [rowAction, setRowAction] =
    React.useState<SocialLinkRowAction | null>(null)
  const [deleteLinks, setDeleteLinks] = React.useState<AdminSocialLink[]>([])

  const columns = React.useMemo(
    () =>
      getSocialLinksTableColumns({
        canDelete,
        canUpdate,
        setRowAction,
      }),
    [canDelete, canUpdate],
  )

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data,
    columns,
    pageCount,
    enableAdvancedFilter: true,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      columnVisibility: { deletedState: false },
      columnPinning: { right: ["actions"] },
    },
    getRowId: (row) => String(row.id),
    shallow: false,
    clearOnDefault: true,
  })

  const refresh = React.useCallback(() => {
    table.toggleAllRowsSelected(false)
    router.refresh()
  }, [router, table])

  return (
    <div className="flex min-w-0 w-full flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Kết quả" value={total} />
        <SummaryCard label="Tổng visit hoàn tất" value={totalViews} />
        <SummaryCard
          label="Đang hoạt động trên trang"
          value={data.filter((link) => link.status === "active").length}
        />
      </div>

      <DataTable
        table={table}
        actionBar={
          <SocialLinksSelectionActionBar
            table={table}
            canUpdate={canUpdate}
            canDelete={canDelete}
            onDelete={setDeleteLinks}
            onSuccess={refresh}
          />
        }
      >
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

      <SocialLinkEditorDialog
        key={
          rowAction?.variant === "update"
            ? rowAction.row.original.id
            : "closed"
        }
        link={
          rowAction?.variant === "update" ? rowAction.row.original : null
        }
        onOpenChange={() => setRowAction(null)}
        onSuccess={refresh}
      />

      <DeleteSocialLinksDialog
        links={
          rowAction?.variant === "delete"
            ? [rowAction.row.original]
            : deleteLinks
        }
        onOpenChange={() => {
          setRowAction(null)
          setDeleteLinks([])
        }}
        onSuccess={refresh}
      />

      <RestoreSocialLinksDialog
        links={
          rowAction?.variant === "restore"
            ? [rowAction.row.original]
            : []
        }
        onOpenChange={() => setRowAction(null)}
        onSuccess={refresh}
      />
    </div>
    
  )
}

function SocialLinksSelectionActionBar({
  table,
  canUpdate,
  canDelete,
  onDelete,
  onSuccess,
}: {
  table: Table<AdminSocialLink>
  canUpdate: boolean
  canDelete: boolean
  onDelete: (links: AdminSocialLink[]) => void
  onSuccess: () => void
}) {
  const [mutating, setMutating] = React.useState(false)
  const selected = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original)
  const activeLinks = selected.filter((link) => !link.deletedAt)
  const deletedLinks = selected.filter((link) => Boolean(link.deletedAt))

  async function changeStatus(status: AdminSocialLinkStatus) {
    if (!activeLinks.length) return
    setMutating(true)
    try {
      const result = await updateAdminSocialLinksStatus(
        activeLinks.map((link) => link.id),
        status,
      )
      toast.success(`Đã cập nhật ${result.updated} social link.`)
      onSuccess()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể cập nhật link.",
      )
    } finally {
      setMutating(false)
    }
  }

  async function restore() {
    if (!deletedLinks.length) return
    setMutating(true)
    try {
      const result = await restoreAdminSocialLinks(
        deletedLinks.map((link) => link.id),
      )
      toast.success(`Đã khôi phục ${result.restored} social link.`)
      onSuccess()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể khôi phục link.",
      )
    } finally {
      setMutating(false)
    }
  }

  return (
    <div
      role="toolbar"
      className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card p-2 shadow-sm"
    >
      <span className="px-1 text-sm">
        <strong>{selected.length}</strong> social link đã chọn
      </span>
      <div className="flex flex-wrap items-center gap-1">
        {canUpdate && activeLinks.length ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              disabled={mutating}
              onClick={() => void changeStatus("active")}
            >
              <CirclePlay /> Kích hoạt
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={mutating}
              onClick={() => void changeStatus("paused")}
            >
              <CirclePause /> Tạm dừng
            </Button>
          </>
        ) : null}
        {canUpdate && deletedLinks.length ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={mutating}
            onClick={() => void restore()}
          >
            <RotateCcw /> Khôi phục
          </Button>
        ) : null}
        {canDelete && activeLinks.length ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            disabled={mutating}
            onClick={() => onDelete(activeLinks)}
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
  )
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 font-semibold text-2xl tabular-nums">
        {new Intl.NumberFormat("vi-VN").format(value)}
      </p>
    </div>
  )
}
