import "server-only"

import { serverApiFetch } from "@/lib/auth/server-access"

import type {
  AdminDashboardData,
  AdminDashboardRange,
} from "../types"

export async function getAdminDashboard(range: AdminDashboardRange) {
  const response = await serverApiFetch(
    `/admin/dashboard?range=${range}`,
    { cache: "no-store" },
    "/admin",
  )

  if (!response.ok) {
    throw new Error(await readApiError(response))
  }

  return (await response.json()) as AdminDashboardData
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
