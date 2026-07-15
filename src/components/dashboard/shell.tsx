import type { ReactNode } from "react"

import { AppShell } from "./app-shell/app-shell"

export function AppLayout({
  children,
}: {
  children: ReactNode
}) {
  return <AppShell>{children}</AppShell>
}

export function DashboardShell({
  children,
}: {
  children: ReactNode
  /** Kept for route compatibility; page titles are rendered by PageHeader in each view. */
  pageTitle?: string
}) {
  return <AppLayout>{children}</AppLayout>
}
