import type { ReactNode } from "react"
import Link from "next/link"

import { AppShell } from "./app-shell/app-shell"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export function AppLayout({
  children,
}: {
  children: ReactNode
}) {
  return <AppShell>{children}</AppShell>
}

function DashboardBreadcrumb({ title }: { title: string }) {
  return (
    <Breadcrumb className="mb-2">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/member">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{title}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export function DashboardShell({
  children,
  pageTitle,
}: {
  children: ReactNode
  pageTitle: string
}) {
  return (
    <AppLayout>
      <DashboardBreadcrumb title={pageTitle} />
      {children}
    </AppLayout>
  )
}
