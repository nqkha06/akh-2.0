import { authenticatedApiFetch } from "@/lib/api-client";

import type {
  AdminWithdrawal,
  AdminWithdrawalsResponse,
  WithdrawalStatus,
} from "../types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await authenticatedApiFetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...Object.fromEntries(new Headers(init?.headers).entries()),
    },
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string | string[];
      error?: string;
    } | null;
    throw new Error(
      Array.isArray(payload?.message)
        ? payload.message.join(", ")
        : payload?.message || payload?.error || "Yêu cầu không thành công.",
    );
  }
  return (await response.json()) as T;
}

export function getAdminWithdrawals(input: {
  status?: WithdrawalStatus;
  search?: string;
  page?: number;
}) {
  const params = new URLSearchParams();
  if (input.status) params.set("status", input.status);
  if (input.search) params.set("search", input.search);
  params.set("page", String(input.page ?? 1));
  params.set("perPage", "20");
  return request<AdminWithdrawalsResponse>(
    `/admin/withdrawals?${params.toString()}`,
  );
}

export function getAdminWithdrawal(id: number) {
  return request<AdminWithdrawal>(`/admin/withdrawals/${id}`);
}

export function processAdminWithdrawal(id: number) {
  return request<AdminWithdrawal>(`/admin/withdrawals/${id}/process`, {
    method: "PATCH",
  });
}

export function markAdminWithdrawalPaid(id: number) {
  return request<AdminWithdrawal>(`/admin/withdrawals/${id}/paid`, {
    method: "PATCH",
  });
}

export function rejectAdminWithdrawal(id: number, statusReason: string) {
  return request<AdminWithdrawal>(`/admin/withdrawals/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ statusReason }),
  });
}
