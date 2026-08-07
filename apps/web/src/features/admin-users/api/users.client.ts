"use client";

import type {
  AdminUserDetail,
  AdminUserSession,
  CreateAdminUserPayload,
  UpdateAdminUserPayload,
  UserStatus,
} from "@/features/admin-users/types";
import { authenticatedApiFetch } from "@/lib/api-client";

export function createAdminUser(payload: CreateAdminUserPayload) {
  return request<AdminUserDetail>("/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateAdminUser(id: number, payload: UpdateAdminUserPayload) {
  return request<AdminUserDetail>(`/admin/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateAdminUserStatus(id: number, status: UserStatus) {
  return request<AdminUserDetail>(`/admin/users/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export function updateAdminUsersStatus(ids: number[], status: UserStatus) {
  return request<{ updated: number }>("/admin/users/bulk/status", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, status }),
  });
}

export function deleteAdminUsers(ids: number[]) {
  return request<{ deleted: number }>("/admin/users/bulk", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
}

export function revokeAdminUserSessions(id: number) {
  return request<{ id: number; revokedSessions: number }>(
    `/admin/users/${id}/revoke-sessions`,
    { method: "POST" },
  );
}

export function getAdminUserSessions(id: number) {
  return request<{ items: AdminUserSession[] }>(`/admin/users/${id}/sessions`, {
    method: "GET",
  });
}

export function revokeAdminUserSession(id: number, sessionId: string) {
  return request<{
    id: number;
    sessionId: string;
    revoked: boolean;
  }>(`/admin/users/${id}/sessions/${encodeURIComponent(sessionId)}/revoke`, {
    method: "POST",
  });
}

export async function impersonateAdminUser(id: number) {
  const response = await authenticatedApiFetch(`/auth/impersonation/${id}`, {
    method: "POST",
  });
  if (!response.ok) throw new Error(await readApiError(response));
  window.location.assign("/member");
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
