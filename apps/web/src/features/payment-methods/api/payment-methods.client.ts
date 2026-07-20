import { authenticatedApiFetch } from "@/lib/api-client";

import type {
  MemberPaymentMethodsDashboard,
  PaymentMethod,
  PaymentMethodPayload,
  UserPaymentMethod,
} from "../types";

async function getError(response: Response) {
  try {
    const payload = (await response.json()) as {
      message?: string | string[];
      error?: string;
    };
    if (Array.isArray(payload.message)) return payload.message.join(", ");
    return payload.message || payload.error || "Yêu cầu không thành công.";
  } catch {
    return "Yêu cầu không thành công.";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await authenticatedApiFetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...Object.fromEntries(new Headers(init?.headers).entries()),
    },
  });
  if (!response.ok) throw new Error(await getError(response));
  return (await response.json()) as T;
}

export async function getAdminPaymentMethods() {
  return request<{ items: PaymentMethod[]; total: number }>(
    "/admin/payment-methods",
  );
}

export async function getAdminPaymentMethod(id: number) {
  return request<PaymentMethod>(`/admin/payment-methods/${id}`);
}

export async function createAdminPaymentMethod(
  payload: PaymentMethodPayload,
) {
  return request<PaymentMethod>("/admin/payment-methods", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminPaymentMethod(
  id: number,
  payload: PaymentMethodPayload,
) {
  return request<PaymentMethod>(`/admin/payment-methods/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminPaymentMethod(id: number) {
  return request<{ success: true; id: number }>(
    `/admin/payment-methods/${id}`,
    { method: "DELETE" },
  );
}

export async function getMemberPaymentMethods() {
  return request<MemberPaymentMethodsDashboard>("/member/payment-methods");
}

export async function createMemberPaymentMethod(
  paymentMethodId: number,
  details: Record<string, string>,
) {
  return request<UserPaymentMethod>("/member/payment-methods", {
    method: "POST",
    body: JSON.stringify({ paymentMethodId, details }),
  });
}

export async function updateMemberPaymentMethod(
  id: number,
  details: Record<string, string>,
) {
  return request<UserPaymentMethod>(`/member/payment-methods/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ details }),
  });
}

export async function deleteMemberPaymentMethod(id: number) {
  return request<{ success: true; id: number }>(
    `/member/payment-methods/${id}`,
    { method: "DELETE" },
  );
}
