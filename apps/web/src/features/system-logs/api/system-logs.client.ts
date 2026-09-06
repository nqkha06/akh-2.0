"use client";

import { authenticatedApiFetch } from "@/lib/api-client";

import type { SystemLogDetail, SystemLogSettings } from "../types";

async function request<T>(path: string, init?: RequestInit) {
  const response = await authenticatedApiFetch(path, init);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
    throw new Error(Array.isArray(body?.message) ? body.message.join(", ") : body?.message || "Không thể xử lý System Logs.");
  }
  return (await response.json()) as T;
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

export const getSystemLog = (id: string) => request<SystemLogDetail>(`/admin/system-logs/${encodeURIComponent(id)}`);
export const deleteSystemLog = (id: string) => request<{ deletedCount: number }>(`/admin/system-logs/${encodeURIComponent(id)}`, { method: "DELETE" });
export const bulkDeleteSystemLogs = (ids: string[]) => request<{ deletedCount: number }>("/admin/system-logs/bulk-delete", json("POST", { ids }));
export const cleanupSystemLogs = (input: Record<string, unknown>) => request<{ dryRun: boolean; matchedCount: number; deletedCount: number }>("/admin/system-logs/cleanup", json("POST", input));
export const updateSystemLogSettings = (input: { globalRetentionDays: number; rules: Array<{ scope: string; retentionDays: number; enabled: boolean }> }) => request<SystemLogSettings>("/admin/system-log-settings", json("PUT", input));
export const createSystemLogCategory = (input: { key: string; name: string; description?: string; isActive: boolean; sortOrder: number }) => request("/admin/system-log-categories", json("POST", input));
export const updateSystemLogCategory = (id: number, input: { name?: string; description?: string; isActive?: boolean; sortOrder?: number }) => request(`/admin/system-log-categories/${id}`, json("PATCH", input));
