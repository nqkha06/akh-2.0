"use client";

import { authenticatedApiFetch } from "@/lib/api-client";

import type {
  AccessLogReviewStatus,
  AdminAccessLogDetail,
} from "../types";

export async function getAdminAccessLog(id: string) {
  return request<AdminAccessLogDetail>(
    `/admin/stu-access-logs/${encodeURIComponent(id)}`,
  );
}

export async function reviewAdminAccessLog(
  id: string,
  input: { status: AccessLogReviewStatus; note?: string },
) {
  return request<AdminAccessLogDetail>(
    `/admin/stu-access-logs/${encodeURIComponent(id)}/review`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

async function request<T>(path: string, init?: RequestInit) {
  const response = await authenticatedApiFetch(path, init);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    throw new Error(
      Array.isArray(body?.message)
        ? body.message.join(", ")
        : body?.message || "Không thể tải dữ liệu access log.",
    );
  }
  return (await response.json()) as T;
}
