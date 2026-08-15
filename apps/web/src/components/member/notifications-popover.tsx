"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, ChevronRight, LoaderCircle } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AnnouncementIcon, announcementPlainText } from "@/features/announcements/components/announcement-ui"
import { useAnnouncements } from "@/features/announcements/components/announcements-provider"

function formatRelativeTime(value: string | null, locale: string) {
  const date = value ? new Date(value) : new Date()
  const seconds = Math.round((date.getTime() - Date.now()) / 1000)
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })
  if (Math.abs(seconds) < 60) return formatter.format(seconds, "second")
  const minutes = Math.round(seconds / 60)
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute")
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour")
  return formatter.format(Math.round(hours / 24), "day")
}

export function NotificationsPopover() {
  const locale = useLocale()
  const t = useTranslations("Announcements")
  const router = useRouter()
  const { notifications, unreadCount, loading, markRead, markAllRead } = useAnnouncements()
  const [open, setOpen] = React.useState(false)

  async function openNotification(id: number, actionUrl: string | null) {
    await markRead(id)
    setOpen(false)
    if (actionUrl?.startsWith("/")) {
      router.push(actionUrl)
      return
    }
    if (actionUrl) {
      window.open(actionUrl, "_blank", "noopener,noreferrer")
      return
    }
    router.push(`/member/announcements?focus=${id}`)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="relative size-9 rounded-lg text-muted-foreground hover:text-foreground" aria-label={t("popover.ariaLabel", { count: unreadCount })}>
              <Bell className="size-[18px]" />
              {unreadCount > 0 ? <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground ring-2 ring-background">{unreadCount > 99 ? "99+" : unreadCount}</span> : null}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={7}>{t("title")}</TooltipContent>
      </Tooltip>

      <PopoverContent align="end" sideOffset={8} className="w-[min(390px,calc(100vw-24px))] rounded-xl p-0 shadow-lg">
        <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-2">
          <div><h2 className="text-sm font-semibold">{t("title")}</h2><p className="text-[11px] text-muted-foreground">{t("popover.unreadCount", { count: unreadCount })}</p></div>
          {unreadCount > 0 ? <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => void markAllRead().catch((error) => toast.error(error instanceof Error && error.message ? error.message : t("errors.update")))}>{t("actions.markAllRead")}</Button> : null}
        </div>
        <Separator />
        <div className="max-h-[min(430px,65dvh)] overflow-y-auto">
          {loading ? <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />{t("loading")}</div> : notifications.length ? notifications.map((item) => {
            const unread = !item.state.readAt
            return <button key={item.id} type="button" onClick={() => void openNotification(item.id, item.actionUrl).catch((error) => toast.error(error instanceof Error && error.message ? error.message : t("errors.open")))} className="flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-accent/60 last:border-b-0">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border bg-muted/40 text-muted-foreground"><AnnouncementIcon type={item.type} /></span>
              <span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-3"><span className="truncate text-sm font-medium">{item.title}</span><span className="shrink-0 text-[10px] text-muted-foreground">{formatRelativeTime(item.publishedAt || item.createdAt, locale)}</span></span><span className="mt-1 line-clamp-2 block text-xs leading-5 text-muted-foreground">{announcementPlainText(item.summary || item.content)}</span></span>
              {unread ? <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-label={t("status.unread")} /> : null}
            </button>
          }) : <div className="px-6 py-12 text-center text-sm text-muted-foreground">{t("empty.all")}</div>}
        </div>
        <Separator />
        <Button asChild variant="ghost" className="h-11 w-full rounded-none rounded-b-xl text-xs"><Link href="/member/announcements" onClick={() => setOpen(false)}>{t("actions.viewAll")}<ChevronRight /></Link></Button>
      </PopoverContent>
    </Popover>
  )
}
