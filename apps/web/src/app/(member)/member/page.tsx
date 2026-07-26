import type { Metadata } from "next"
import { Suspense } from "react"

import { getMemberDashboard } from "@/features/member-dashboard/api/dashboard.server"
import {
  MemberDashboard,
  MemberDashboardSkeleton,
} from "@/features/member-dashboard/components/member-dashboard"
import {
  isMemberDashboardRange,
  type MemberDashboardRange,
} from "@/features/member-dashboard/types"

export const metadata: Metadata = {
  title: "Tổng quan thành viên",
}

export default async function MemberHomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const value = Array.isArray(params.range) ? params.range[0] : params.range
  const range: MemberDashboardRange = isMemberDashboardRange(value)
    ? value
    : "30d"

  return (
    <Suspense fallback={<MemberDashboardSkeleton />}>
      <MemberDashboardContent range={range} />
    </Suspense>
  )
}

async function MemberDashboardContent({
  range,
}: {
  range: MemberDashboardRange
}) {
  const data = await getMemberDashboard(range)
  return <MemberDashboard data={data} range={range} />
}
