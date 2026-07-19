"use client";

import type {
  AdminMonetizationLevel,
  AdminMonetizationLevelPayload,
} from "@/features/admin-monetization-levels/types";
import { authenticatedApiFetch } from "@/lib/api-client";

export function createMonetizationLevel(
  payload: AdminMonetizationLevelPayload,
) {
  return request<AdminMonetizationLevel>("/admin/monetization-levels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateMonetizationLevel(
  id: number,
  payload: AdminMonetizationLevelPayload,
) {
  return request<AdminMonetizationLevel>(`/admin/monetization-levels/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteMonetizationLevel(id: number) {
  return request<{ success: boolean; id: number }>(
    `/admin/monetization-levels/${id}`,
    { method: "DELETE" },
  );
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
