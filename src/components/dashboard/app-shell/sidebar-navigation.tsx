"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  getVisibleNavigationGroups,
  isNavigationItemActive,
  type NavigationItem,
} from "./navigation"

function NavigationLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavigationItem
  collapsed: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const t = useTranslations("Dashboard")
  const active = isNavigationItemActive(pathname, item)
  const Icon = item.icon

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-10 items-center rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring motion-reduce:transition-none",
        collapsed ? "justify-center px-0" : "gap-2.5 px-3",
        active
          ? "bg-primary/10 font-semibold text-primary"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className={cn("size-[18px] shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-accent-foreground")} strokeWidth={active ? 2.15 : 1.9} />
      {collapsed ? <span className="sr-only">{t(item.titleKey)}</span> : <span className="min-w-0 flex-1 truncate">{t(item.titleKey)}</span>}
      {!collapsed && item.badge ? <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{item.badge}</span> : null}
    </Link>
  )

  if (!collapsed) return link

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>{t(item.titleKey)}</TooltipContent>
    </Tooltip>
  )
}

export function SidebarNavigation({
  collapsed = false,
  onNavigate,
  canAccess,
}: {
  collapsed?: boolean
  onNavigate?: () => void
  canAccess?: (permission: string) => boolean
}) {
  const t = useTranslations("Dashboard")
  const groups = getVisibleNavigationGroups(canAccess)

  return (
    <nav className={cn("dashboard-sidebar-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden", collapsed ? "px-2 py-3" : "px-3 py-3")} aria-label={t("sidebar.navigation")}>
      <div className={collapsed ? "space-y-3" : "space-y-5"}>
        {groups.map((group, groupIndex) => (
          <section key={group.labelKey} className={cn(collapsed && groupIndex > 0 ? "border-t border-sidebar-border pt-3" : undefined)}>
            {collapsed ? null : (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.11em] text-muted-foreground">
                {t(group.labelKey)}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => <NavigationLink key={item.href} item={item} collapsed={collapsed} onNavigate={onNavigate} />)}
            </div>
          </section>
        ))}
      </div>
    </nav>
  )
}

