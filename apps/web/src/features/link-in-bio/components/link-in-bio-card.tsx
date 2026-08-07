"use client"

import { useState } from "react"
import { Copy, Pencil } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { BioPageDto } from "@/lib/api-client"
import {
  getSiteHost,
  useSiteBrand,
} from "@/features/site-settings/components/site-brand-provider"
import { LinkInBioActionsMenu } from "./link-in-bio-actions-menu"
import { copyBioUrl, DeleteLinkInBioDialog, LinkInBioQrDialog, LinkInBioStatsDialog } from "./link-in-bio-dialogs"
import { LinkInBioThemeAccent } from "./link-in-bio-theme-indicator"

function StatusBadge({ status }: { status: string }) {
  if (status === "published") return <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">Đã xuất bản</Badge>
  if (status === "paused") return <Badge variant="outline" className="border-destructive/20 bg-destructive/10 text-destructive">Đã tạm dừng</Badge>
  return <Badge variant="secondary">Bản nháp</Badge>
}

function formatUpdatedDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value))
}

export function LinkInBioCard({
  page,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onDelete,
}: {
  page: BioPageDto
  onEdit: (page: BioPageDto) => void
  onDuplicate: (page: BioPageDto) => void
  onToggleStatus: (page: BioPageDto) => void
  onDelete: (page: BioPageDto) => Promise<void>
}) {
  const [qrOpen, setQrOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const brand = useSiteBrand()
  const siteHost = getSiteHost(brand)

  return (
    <>
      <Card className="relative gap-0 overflow-hidden rounded-xl border-border bg-card py-0 shadow-none">
        <LinkInBioThemeAccent appearance={page.appearance} />

        <div className="flex items-start justify-between gap-4 px-5 py-5">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold text-foreground">{page.name}</h2>
            <div className="mt-1 flex min-w-0 items-center gap-1.5">
              <span className="truncate text-xs text-muted-foreground">
                {siteHost}{page.publicUrl}
              </span>
              <Button type="button" variant="ghost" size="icon-sm" className="size-7 shrink-0 text-muted-foreground" onClick={() => void copyBioUrl(page)} aria-label={`Sao chép liên kết ${page.name}`}><Copy className="size-3.5" /></Button>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <StatusBadge status={page.status} />
            <LinkInBioActionsMenu
              page={page}
              onCopy={() => void copyBioUrl(page)}
              onQr={() => setQrOpen(true)}
              onStats={() => setStatsOpen(true)}
              onEdit={() => onEdit(page)}
              onDuplicate={() => onDuplicate(page)}
              onToggleStatus={() => onToggleStatus(page)}
              onDelete={() => setDeleteOpen(true)}
            />
          </div>
        </div>

        <div className="flex min-h-14 items-center justify-between gap-3 border-t border-border px-5 py-2.5">
          <p className="min-w-0 truncate text-xs text-muted-foreground">Cập nhật {formatUpdatedDate(page.updatedAt)}</p>
          <Button type="button" size="sm" className="h-10 shrink-0 rounded-lg px-3 shadow-none sm:h-9" onClick={() => onEdit(page)}><Pencil className="size-4" />Chỉnh sửa</Button>
        </div>
      </Card>

      <LinkInBioQrDialog page={page} open={qrOpen} onOpenChange={setQrOpen} />
      <LinkInBioStatsDialog page={page} open={statsOpen} onOpenChange={setStatsOpen} />
      <DeleteLinkInBioDialog page={page} open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={() => onDelete(page)} />
    </>
  )
}
