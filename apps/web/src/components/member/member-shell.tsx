"use client"

import { useEffect, useState, type ReactNode } from "react"

import { MemberFooter } from "./member-footer"
import { MemberHeader } from "./member-header"
import { MemberSidebar } from "./member-sidebar"
import { MobileSidebar } from "./mobile-sidebar"

const SIDEBAR_STORAGE_KEY = "member:sidebar-collapsed"

export function MemberShell({
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
    <div className="flex h-dvh min-h-0 overflow-hidden bg-background text-foreground">
      <MemberSidebar
        collapsed={collapsed}
        onToggle={toggleSidebar}
        canAccess={canAccess}
      />
      <MobileSidebar
        open={mobileSidebarOpen}
        onOpenChange={setMobileSidebarOpen}
        canAccess={canAccess}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <MemberHeader
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />
        <main
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          id="dashboard-main-content"
        >
          <div className="flex min-h-full flex-col">
            <div className="flex-1 px-4 pb-10 pt-5 sm:px-6 lg:px-8 lg:pt-6">
              {children}
            </div>
            <MemberFooter />
          </div>
        </main>
      </div>
    </div>
  )
}
