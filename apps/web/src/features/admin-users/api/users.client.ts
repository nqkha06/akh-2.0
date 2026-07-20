"use client";

import type {
  AdminUser,
  AdminUserPayload,
} from "@/features/admin-users/types";
import { authenticatedApiFetch } from "@/lib/api-client";

export async function createAdminUser(
  payload: AdminUserPayload & { password: string },
) {
  return request<AdminUser>("/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateAdminUser(
  id: number,
  payload: AdminUserPayload,
  currentUserId: number,
) {
  const body: Partial<AdminUserPayload> = { ...payload };
  if (!body.password) delete body.password;
  if (id === currentUserId) {
    delete body.roles;
    delete body.permissions;
  }

  return request<AdminUser>(`/admin/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function deleteAdminUser(id: number) {
  return request<{ id: number; deleted: true }>(`/admin/users/${id}`, {
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
