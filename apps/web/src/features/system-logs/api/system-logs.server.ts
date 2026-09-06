import "server-only";

import { serverApiFetch } from "@/lib/auth/server-access";

import type { SystemLogsQuery } from "../query/system-logs-search-params";
import type {
  SystemLogSettings,
  SystemLogsResponse,
  SystemLogStats,
} from "../types";

function serialize(query: SystemLogsQuery) {
  const params = new URLSearchParams({
    page: String(query.page),
    perPage: String(query.perPage),
    sortOrder: "desc",
  });
  for (const key of ["level", "category", "context", "event", "user", "keyword", "from", "to"] as const) {
    const value = query[key];
    if (value) params.set(key, String(value));
  }
  return params.toString();
}

async function get<T>(path: string) {
  const response = await serverApiFetch(path, { cache: "no-store" }, "/admin/system-logs");
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as T;
}

export const getSystemLogs = (query: SystemLogsQuery) =>
  get<SystemLogsResponse>(`/admin/system-logs?${serialize(query)}`);
export const getSystemLogStats = () => get<SystemLogStats>("/admin/system-logs/stats");
export const getSystemLogSettings = () =>
  get<SystemLogSettings>("/admin/system-log-settings");

async function readError(response: Response) {
  const body = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
  return Array.isArray(body?.message) ? body.message.join(", ") : body?.message || `Request failed (${response.status})`;
}
