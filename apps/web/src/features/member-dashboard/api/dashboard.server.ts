import "server-only"

import { serverApiFetch } from "@/lib/auth/server-access"

import type { MemberDashboardData, MemberDashboardRange } from "../types"

export async function getMemberDashboard(range: MemberDashboardRange) {
  const response = await serverApiFetch(
    `/member/dashboard?range=${range}`,
    { cache: "no-store" },
    "/member",
  )

  if (!response.ok) {
    throw new Error(await readApiError(response))
  }

  return (await response.json()) as MemberDashboardData
}

async function readApiError(response: Response) {
  try {
    const body = (await response.json()) as { message?: string | string[] }
    return Array.isArray(body.message)
      ? body.message.join(", ")
      : body.message || `Request failed with ${response.status}`
  } catch {
    return `Request failed with ${response.status}`
  }
}
