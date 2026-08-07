"use client";

import { authenticatedApiFetch } from "@/lib/api-client";
import type {
  AdminLinkReport,
  AdminLinkReportsResponse,
  LinkReportReason,
  LinkReportStatus,
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

export function getAdminLinkReports(input: {
  search?: string;
  status?: LinkReportStatus | "all";
  reason?: LinkReportReason | "all";
  sort?: "newest" | "oldest" | "updated";
  page?: number;
}) {
  const params = new URLSearchParams({
    page: String(input.page ?? 1),
    perPage: "20",
  });
  if (input.search) params.set("search", input.search);
  if (input.status && input.status !== "all") params.set("status", input.status);
  if (input.reason && input.reason !== "all") params.set("reason", input.reason);
  if (input.sort === "oldest") {
    params.set("sortBy", "createdAt");
    params.set("sortOrder", "asc");
  } else if (input.sort === "updated") {
    params.set("sortBy", "updatedAt");
    params.set("sortOrder", "desc");
  }
  return request<AdminLinkReportsResponse>(
    `/admin/link-reports?${params.toString()}`,
    { cache: "no-store" },
  );
}

export function getAdminLinkReport(id: number) {
  return request<AdminLinkReport>(`/admin/link-reports/${id}`, {
    cache: "no-store",
  });
}

export function updateAdminLinkReport(
  id: number,
  input: { status: LinkReportStatus; resolutionNote?: string },
) {
  return request<AdminLinkReport>(`/admin/link-reports/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteAdminLinkReport(id: number) {
  return request<{ deleted: number }>(`/admin/link-reports/${id}`, {
    method: "DELETE",
  });
}
