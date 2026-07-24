"use client";

import { authenticatedApiFetch } from "@/lib/api-client";
import type {
  AdminSupportTicket,
  AdminSupportTicketsResponse,
} from "../types";
import type {
  SupportCategory,
  SupportRequestStatus,
  SupportTicketPriority,
} from "@/components/dashboard/support/types";

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

export function getAdminSupportTickets(input: {
  search?: string;
  status?: SupportRequestStatus | "all";
  priority?: SupportTicketPriority | "all";
  category?: SupportCategory | "all";
  assignment?: "all" | "mine" | "unassigned";
  page?: number;
}) {
  const params = new URLSearchParams({
    page: String(input.page ?? 1),
    perPage: "20",
  });
  if (input.search) params.set("search", input.search);
  if (input.status && input.status !== "all") params.set("status", input.status);
  if (input.priority && input.priority !== "all") {
    params.set("priority", input.priority);
  }
  if (input.category && input.category !== "all") {
    params.set("category", input.category);
  }
  if (input.assignment && input.assignment !== "all") {
    params.set("assignment", input.assignment);
  }
  return request<AdminSupportTicketsResponse>(
    `/admin/support/tickets?${params.toString()}`,
    { cache: "no-store" },
  );
}

export function getAdminSupportTicket(id: number) {
  return request<AdminSupportTicket>(`/admin/support/tickets/${id}`, {
    cache: "no-store",
  });
}

export function replyAdminSupportTicket(id: number, content: string) {
  return request<AdminSupportTicket>(`/admin/support/tickets/${id}/replies`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export function updateAdminSupportTicket(
  id: number,
  input: {
    status?: SupportRequestStatus;
    priority?: SupportTicketPriority;
    assignToMe?: boolean;
    unassign?: boolean;
  },
) {
  return request<AdminSupportTicket>(`/admin/support/tickets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
