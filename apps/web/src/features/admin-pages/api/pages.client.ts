"use client";

import type {
  AdminPage,
  AdminPagePayload,
  PageStatus,
} from "@/features/admin-pages/types";
import { authenticatedApiFetch } from "@/lib/api-client";

export function createAdminPage(payload: AdminPagePayload) {
  return request<AdminPage>("/admin/pages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateAdminPage(id: number, payload: AdminPagePayload) {
  const body = { ...payload };
  delete body.status;
  return request<AdminPage>(`/admin/pages/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function updateAdminPageStatus(id: number, status: PageStatus) {
  return request<AdminPage>(`/admin/pages/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export function updateAdminPagesStatus(ids: number[], status: PageStatus) {
  return request<{ updated: number }>("/admin/pages/bulk/status", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, status }),
  });
}

export function deleteAdminPages(ids: number[]) {
  return request<{ deleted: number }>("/admin/pages/bulk", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
}

async function request<T>(path: string, init: RequestInit) {
  const response = await authenticatedApiFetch(path, init);
  if (!response.ok) throw new Error(await readApiError(response));
  return (await response.json()) as T;
}

async function readApiError(response: Response) {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    return Array.isArray(body.message)
      ? body.message.join(", ")
      : body.message || `Request failed with ${response.status}`;
  } catch {
    return `Request failed with ${response.status}`;
  }
}
