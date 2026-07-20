"use client";

import type {
  AdminRole,
  RolePayload,
} from "@/features/admin-authorization/types";
import { authenticatedApiFetch } from "@/lib/api-client";

export function createRole(payload: RolePayload & { key: string }) {
  return request<AdminRole>("/admin/roles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateRole(id: number, payload: RolePayload) {
  const body = { ...payload };
  delete body.key;
  return request<AdminRole>(`/admin/roles/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function deleteRole(id: number) {
  return request<{ id: number; deleted: true }>(`/admin/roles/${id}`, {
    method: "DELETE",
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
