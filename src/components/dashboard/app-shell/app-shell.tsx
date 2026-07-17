"use client"

import { useEffect, useState, type ReactNode } from "react"

import { TooltipProvider } from "@/components/ui/tooltip"
import { AppHeader } from "./app-header"
import { AppFooter } from "./app-footer"
import { AppSidebar } from "./app-sidebar"
import { MobileSidebar } from "./mobile-sidebar"

const SIDEBAR_STORAGE_KEY = "rekonise:sidebar-collapsed"

export function AppShell({
  children,
  canAccess,
}: {
  children: ReactNode
  canAccess?: (permission: string) => boolean
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setCollapsed(window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true")
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const toggleSidebar = () => {
    setCollapsed((current) => {
      const next = !current
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next))
      return next
    })
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-dvh min-h-0 overflow-hidden bg-background text-foreground">
        <AppSidebar collapsed={collapsed} onToggle={toggleSidebar} canAccess={canAccess} />
        <MobileSidebar open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen} canAccess={canAccess} />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <AppHeader onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />
          <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain" id="dashboard-main-content">
            <div className="flex min-h-full flex-col">
              <div className="flex-1 px-4 pb-10 pt-5 sm:px-6 lg:px-8 lg:pt-6">{children}</div>
              <AppFooter />
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
