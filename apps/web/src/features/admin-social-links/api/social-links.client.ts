"use client"

import type {
  AdminSocialLink,
  AdminSocialLinkPayload,
  AdminSocialLinkStatus,
} from "@/features/admin-social-links/types"
import { authenticatedApiFetch } from "@/lib/api-client"

export async function updateAdminSocialLink(
  id: number,
  payload: AdminSocialLinkPayload,
) {
  return request<AdminSocialLink>(`/admin/social-links/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export async function updateAdminSocialLinksStatus(
  ids: number[],
  status: AdminSocialLinkStatus,
) {
  return request<{ updated: number }>("/admin/social-links/bulk/status", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, status }),
  })
}

export async function deleteAdminSocialLinks(ids: number[]) {
  return request<{ deleted: number }>("/admin/social-links/bulk", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  })
}

export async function restoreAdminSocialLinks(ids: number[]) {
  return request<{ restored: number }>("/admin/social-links/bulk/restore", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  })
}

async function request<T>(path: string, init: RequestInit) {
  const response = await authenticatedApiFetch(path, init)
  if (!response.ok) throw new Error(await readApiError(response))
  return (await response.json()) as T
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
