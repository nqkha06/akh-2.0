"use client";

import { authenticatedApiFetch } from "@/lib/api-client";

import type {
  AdminCurrenciesResponse,
  Currency,
  CurrencyPayload,
  MemberCurrencyPreferences,
} from "../types";

async function request<T>(path: string, init?: RequestInit) {
  const response = await authenticatedApiFetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...Object.fromEntries(new Headers(init?.headers).entries()),
    },
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as T;
}

export function getAdminCurrencies() {
  return request<AdminCurrenciesResponse>("/admin/settings/currencies");
}

export function createCurrency(payload: CurrencyPayload) {
  return request<Currency>("/admin/settings/currencies", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCurrency(
  id: number,
  payload: Partial<Omit<CurrencyPayload, "code">>,
) {
  return request<Currency>(`/admin/settings/currencies/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function setDefaultCurrency(id: number) {
  return request<Currency>(`/admin/settings/currencies/${id}/default`, {
    method: "PATCH",
  });
}

export function deleteCurrency(id: number) {
  return request<{ success: true; id: number }>(
    `/admin/settings/currencies/${id}`,
    { method: "DELETE" },
  );
}

export function updateMemberCurrency(currency: string) {
  return request<MemberCurrencyPreferences>("/member/preferences/currency", {
    method: "PATCH",
    body: JSON.stringify({ currency }),
  });
}

async function readError(response: Response) {
  try {
    const body = (await response.json()) as {
      message?: string | string[];
      error?: { message?: string };
    };
    if (Array.isArray(body.message)) return body.message.join(", ");
    return body.message || body.error?.message || "Yêu cầu không thành công.";
  } catch {
    return "Yêu cầu không thành công.";
  }
}
