"use client"

import {
  CircleDollarSign,
  ExternalLink,
  Link2,
  MousePointerClick,
  UserRound,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { AdminSocialLink } from "@/features/admin-social-links/types"

export function SocialLinkDetailsSheet({
  link,
  onOpenChange,
}: {
  link: AdminSocialLink | null
  onOpenChange: (open: boolean) => void
}) {
  if (!link) return null

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-2xl">
        <SheetHeader className="border-b px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="min-w-0">
              <SheetTitle className="truncate">{link.title}</SheetTitle>
              <SheetDescription className="mt-1 truncate">
                /l/{link.slug}
              </SheetDescription>
            </div>
            <StatusBadge link={link} />
          </div>
        </SheetHeader>

        <div className="space-y-6 px-5 py-5 sm:px-6">
          <section className="grid gap-3 sm:grid-cols-2">
            <Metric
              icon={CircleDollarSign}
              label="Rev"
              value={formatMoney(link.revenue)}
            />
            <Metric
              icon={MousePointerClick}
              label="View"
              value={new Intl.NumberFormat("vi-VN").format(link.views)}
            />
          </section>

          <section className="rounded-xl border bg-muted/20 p-4">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <UserRound className="size-4" /> Chủ sở hữu
            </p>
            <div className="mt-3 flex items-center gap-3">
              <Avatar className="size-10 border">
                <AvatarImage
                  src={link.owner.avatar ?? undefined}
                  alt={link.owner.name}
                />
                <AvatarFallback>{initials(link.owner.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium text-sm">
                  {link.owner.name}
                </p>
                <p className="truncate text-muted-foreground text-xs">
                  {link.owner.email}
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-medium">Cấu hình link</h3>
            <dl className="mt-3 divide-y rounded-xl border px-4 text-sm">
              <DetailRow label="ID" value={`#${link.id}`} />
              <DetailRow
                label="Loại destination"
                value={link.destinationType.toUpperCase()}
              />
              <DetailRow label="Destination" value={destinationLabel(link)} />
              <DetailRow
                label="Số social action"
                value={String(link.actionsCount)}
              />
              <DetailRow
                label="Giới hạn click"
                value={
                  link.maxClicks === null
                    ? "Không giới hạn"
                    : String(link.maxClicks)
                }
              />
              <DetailRow
                label="Hết hạn"
                value={link.expiresAt ? formatDate(link.expiresAt) : "Không"}
              />
            </dl>
          </section>

          <section>
            <h3 className="text-sm font-medium">
              Social actions ({link.actions.length})
            </h3>
            {link.actions.length ? (
              <div className="mt-3 divide-y rounded-xl border">
                {link.actions.map((action) => (
                  <div
                    key={action.id}
                    className="flex items-center justify-between gap-4 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{action.platform}</Badge>
                        <span className="text-sm">{action.action}</span>
                      </div>
                      <p className="mt-1 truncate text-muted-foreground text-xs">
                        {action.url}
                      </p>
                    </div>
                    <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
                      #{action.position + 1}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 rounded-xl border border-dashed px-4 py-6 text-center text-muted-foreground text-sm">
                Link này chưa có social action.
              </p>
            )}
          </section>

          <section>
            <h3 className="text-sm font-medium">Thời gian</h3>
            <dl className="mt-3 divide-y rounded-xl border px-4 text-sm">
              <DetailRow label="Ngày tạo" value={formatDate(link.createdAt)} />
              <DetailRow
                label="Cập nhật gần nhất"
                value={formatDate(link.updatedAt)}
              />
              {link.deletedAt ? (
                <DetailRow label="Đã xóa" value={formatDate(link.deletedAt)} />
              ) : null}
            </dl>
          </section>

          <Button asChild className="w-full">
            <a href={`/l/${link.slug}`} target="_blank" rel="noreferrer">
              <Link2 /> Mở link công khai <ExternalLink />
            </a>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CircleDollarSign
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-4" /> {label}
      </p>
      <p className="mt-2 font-semibold text-2xl tabular-nums">{value}</p>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] gap-4 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-all text-right font-medium">{value}</dd>
    </div>
  )
}

function StatusBadge({ link }: { link: AdminSocialLink }) {
  if (link.deletedAt) return <Badge variant="destructive">Đã xóa</Badge>
  if (link.status === "active") {
    return (
      <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
        Hoạt động
      </Badge>
    )
  }
  return (
    <Badge variant="outline">
      {link.status === "paused" ? "Tạm dừng" : "Không hoạt động"}
    </Badge>
  )
}

function destinationLabel(link: AdminSocialLink) {
  if (link.destinationType === "url") return link.destinationUrl || "—"
  if (link.destinationType === "file") {
    return link.destinationFile
      ? `${link.destinationFile.name} (${link.destinationFile.alias})`
      : "—"
  }
  return link.destinationSnippet?.name || "—"
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function formatMoney(value: string) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return value
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 4,
  }).format(amount)
}
