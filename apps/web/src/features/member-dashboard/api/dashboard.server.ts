import "server-only"

import { serverApiFetch } from "@/lib/auth/server-access"

import type { MemberDashboardData } from "../types"

export async function getMemberDashboard() {
  const response = await serverApiFetch(
    "/member/dashboard",
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
