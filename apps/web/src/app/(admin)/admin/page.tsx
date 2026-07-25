import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { RefreshCw } from "lucide-react"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Button } from "@/components/ui/button"
import { getAdminDashboard } from "@/features/admin-dashboard/api/dashboard.server"
import {
  AdminDashboard,
  AdminDashboardSkeleton,
} from "@/features/admin-dashboard/components/admin-dashboard"
import type { AdminDashboardRange } from "@/features/admin-dashboard/types"

export const metadata: Metadata = {
  title: "Dashboard quản trị",
}

const ranges: Array<{ value: AdminDashboardRange; label: string }> = [
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" },
  { value: "90d", label: "90 ngày" },
]

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const value = Array.isArray(params.range) ? params.range[0] : params.range
  const range: AdminDashboardRange =
    value === "7d" || value === "90d" ? value : "30d"
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <AdminPageHeader
        title="Dashboard"
        description="Tình hình vận hành và các lượt vượt social link thành công trong hệ thống."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="flex rounded-lg border border-border bg-muted/20 p-1"
              aria-label="Khoảng thời gian"
            >
              {ranges.map((item) => (
                <Button
                  key={item.value}
                  asChild
                  variant={range === item.value ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 shadow-none"
                >
                  <Link href={`/admin?range=${item.value}`}>{item.label}</Link>
                </Button>
              ))}
            </div>
            <Button asChild variant="outline" size="icon" className="shadow-none">
              <Link href={`/admin?range=${range}`} aria-label="Làm mới dashboard">
                <RefreshCw />
              </Link>
            </Button>
          </div>
        }
      />
      <Suspense fallback={<AdminDashboardSkeleton />}>
        <AdminDashboardContent range={range} />
      </Suspense>
    </main>
  )
}

async function AdminDashboardContent({
  range,
}: {
  range: AdminDashboardRange
}) {
  const data = await getAdminDashboard(range)
  return <AdminDashboard data={data} />
}
