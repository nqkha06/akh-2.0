import "server-only"

import { serializeAdminSocialLinksQuery } from "@/features/admin-social-links/api/social-links-query-serializer"
import { adaptAdminSocialLinksResponse } from "@/features/admin-social-links/api/social-links-response-adapter"
import type { AdminSocialLinksTableQuery } from "@/features/admin-social-links/query/social-links-search-params"
import type { NestPaginatedAdminSocialLinksResponse } from "@/features/admin-social-links/types"
import { getServerSession } from "@/lib/auth/server-session"

const apiUrl = process.env.API_INTERNAL_URL?.replace(/\/$/, "")

export async function getAdminSocialLinksTableData(
  state: AdminSocialLinksTableQuery,
) {
  const session = await getServerSession()
  if (!apiUrl || !session?.backendAccessToken) {
    throw new Error("Phiên quản trị không hợp lệ.")
  }

  const response = await fetch(
    `${apiUrl}/admin/social-links?${serializeAdminSocialLinksQuery(state)}`,
    {
      headers: {
        Authorization: `Bearer ${session.backendAccessToken}`,
      },
      cache: "no-store",
    },
  )

  if (!response.ok) {
    throw new Error(await readApiError(response))
  }

  return adaptAdminSocialLinksResponse(
    (await response.json()) as NestPaginatedAdminSocialLinksResponse,
  )
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
