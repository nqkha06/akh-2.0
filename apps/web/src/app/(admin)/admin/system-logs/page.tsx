import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  getSystemLogs,
  getSystemLogSettings,
  getSystemLogStats,
} from "@/features/system-logs/api/system-logs.server";
import { SystemLogsDashboard } from "@/features/system-logs/components/system-logs-dashboard";
import { systemLogsSearchParamsCache } from "@/features/system-logs/query/system-logs-search-params";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "System Logs" };
type SearchParams = Record<string, string | string[] | undefined>;

export default async function SystemLogsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { currentUser } = await requireAdmin();
  if (!currentUser.permissions.includes("system_logs.view")) redirect("/admin");
  const query = systemLogsSearchParamsCache.parse(await searchParams);
  const [result, stats, settings] = await Promise.all([
    getSystemLogs(query),
    getSystemLogStats(),
    getSystemLogSettings(),
  ]);
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <AdminPageHeader
        title="System Logs"
        description="Tìm kiếm, phân loại và xử lý nhật ký vận hành toàn hệ thống."
      />
      <SystemLogsDashboard
        result={result}
        stats={stats}
        settings={settings}
        query={query}
        canDelete={currentUser.permissions.includes("system_logs.delete")}
        canManageSettings={currentUser.permissions.includes("system_logs.manage_settings")}
      />
    </main>
  );
}
