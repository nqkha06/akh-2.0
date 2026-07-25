import type { Metadata } from "next"
import "flag-icons/css/flag-icons.min.css"

import { AdminFooter } from "@/components/admin/admin-footer"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AdminAuthorizationProvider } from "@/features/admin-authorization/components/admin-authorization-provider"
import { getPublicSiteSettings } from "@/features/site-settings/api/public-settings.server"
import { requireAdmin } from "@/lib/auth/guards"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings()
  return {
    title: `Admin Console — ${settings.siteName}`,
    description: `Không gian vận hành và quản trị hệ thống ${settings.siteName}.`,
  }
}

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { currentUser } = await requireAdmin()

  return (
    <AdminAuthorizationProvider
      permissions={currentUser.permissions ?? []}
    >
      <TooltipProvider>
        <div className="min-h-svh bg-background text-foreground">
          <SidebarProvider
            // style={
            //   {
            //     "--sidebar-width": "calc(var(--spacing) * 72)",
            //     "--header-height": "calc(var(--spacing) * 12)",
            //   } as React.CSSProperties
            // }
          >
            <AdminSidebar variant="sidebar" />
            <SidebarInset className="min-w-0">
              <AdminHeader />
              {children}
              <AdminFooter />
            </SidebarInset>
          </SidebarProvider>
        </div>
      </TooltipProvider>
    </AdminAuthorizationProvider>
  )
}
