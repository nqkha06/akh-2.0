"use client"

import { SidebarBrand } from "./sidebar-brand"
import { SidebarNavigation } from "./sidebar-navigation"

export function MemberSidebar({
  collapsed,
  onToggle,
  canAccess,
}: {
  collapsed: boolean
  onToggle: () => void
  canAccess?: (permission: string) => boolean
}) {
  return (
    <aside
      className="hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out motion-reduce:transition-none lg:flex"
      style={{ width: collapsed ? "var(--sidebar-width-collapsed)" : "var(--sidebar-width)" }}
    >
      <SidebarBrand collapsed={collapsed} onToggle={onToggle} />
      <SidebarNavigation collapsed={collapsed} canAccess={canAccess} />

    </aside>
  )
}
