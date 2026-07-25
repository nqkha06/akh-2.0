import type { Metadata } from "next"
import { Suspense } from "react"

import { getMemberDashboard } from "@/features/member-dashboard/api/dashboard.server"
import {
  MemberDashboard,
  MemberDashboardSkeleton,
} from "@/features/member-dashboard/components/member-dashboard"

export const metadata: Metadata = {
  title: "Tổng quan thành viên",
}

export default async function MemberHomePage() {
  return (
    <Suspense fallback={<MemberDashboardSkeleton />}>
      <MemberDashboardContent />
    </Suspense>
  )
}

async function MemberDashboardContent() {
  const data = await getMemberDashboard()
  return <MemberDashboard data={data} />
}
