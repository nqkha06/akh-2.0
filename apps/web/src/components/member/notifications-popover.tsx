"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Bell, Folder, Gauge, Link2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function NotificationsPopover() {
  const t = useTranslations("Dashboard")
  const [readIds, setReadIds] = useState<number[]>([])
  const notifications = [
    { id: 1, icon: Link2, title: t("topbar.notificationItems.linkReadyTitle"), description: t("topbar.notificationItems.linkReadyDescription"), time: t("topbar.notificationItems.justNow") },
    { id: 2, icon: Gauge, title: t("topbar.notificationItems.performanceTitle"), description: t("topbar.notificationItems.performanceDescription"), time: t("topbar.notificationItems.hoursAgo") },
    { id: 3, icon: Folder, title: t("topbar.notificationItems.fileReadyTitle"), description: t("topbar.notificationItems.fileReadyDescription"), time: t("topbar.notificationItems.yesterday") },
  ]
  const unreadCount = notifications.filter((notification) => !readIds.includes(notification.id)).length

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="relative size-9 rounded-lg text-muted-foreground hover:text-foreground" aria-label={`${t("topbar.notifications")}: ${unreadCount} ${t("topbar.unread")}`}>
              <Bell className="size-[18px]" />
              {unreadCount > 0 ? (
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary ring-2 ring-background">
                  <span className="sr-only">{unreadCount} {t("topbar.unread")}</span>
                </span>
              ) : null}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={7}>{t("topbar.notifications")}</TooltipContent>
      </Tooltip>

      <PopoverContent align="end" sideOffset={8} className="w-[min(380px,calc(100vw-24px))] rounded-lg p-0 shadow-lg">
        <div className="flex h-12 items-center justify-between gap-3 px-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">{t("topbar.notifications")}</h2>
            <p className="text-[11px] text-muted-foreground">{unreadCount} {t("topbar.unread")}</p>
          </div>
          {unreadCount > 0 ? <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground" onClick={() => setReadIds(notifications.map((item) => item.id))}>{t("topbar.markAllRead")}</Button> : null}
        </div>
        <Separator />
        <div className="max-h-[min(420px,65dvh)] overflow-y-auto">
          {notifications.length ? notifications.map((notification) => {
            const Icon = notification.icon
            const unread = !readIds.includes(notification.id)
            return (
              <button key={notification.id} type="button" onClick={() => setReadIds((current) => current.includes(notification.id) ? current : [...current, notification.id])} className="flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-accent/60 last:border-b-0">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon className="size-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-3">
                    <span className="truncate text-sm font-medium text-foreground">{notification.title}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{notification.time}</span>
                  </span>
                  <span className="mt-1 line-clamp-2 block text-xs leading-5 text-muted-foreground">{notification.description}</span>
                </span>
                {unread ? <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"><span className="sr-only">{t("topbar.unread")}</span></span> : null}
              </button>
            )
          }) : <div className="px-6 py-10 text-center text-sm text-muted-foreground">{t("topbar.noNotifications")}</div>}
        </div>
      </PopoverContent>
    </Popover>
  )
}

