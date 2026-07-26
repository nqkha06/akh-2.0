"use client";

import type {
  AdminLoyaltyTier,
  AdminLoyaltyTierPayload,
} from "@/features/admin-loyalty-tiers/types";
import { authenticatedApiFetch } from "@/lib/api-client";

export function createLoyaltyTier(payload: AdminLoyaltyTierPayload) {
  return request<AdminLoyaltyTier>("/admin/loyalty-tiers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateLoyaltyTier(
  id: number,
  payload: AdminLoyaltyTierPayload,
) {
  return request<AdminLoyaltyTier>(`/admin/loyalty-tiers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteLoyaltyTier(id: number) {
  return request<{ success: boolean; id: number }>(
    `/admin/loyalty-tiers/${id}`,
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
