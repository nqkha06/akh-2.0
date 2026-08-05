import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import {
  getAdminAccessLogs,
  getAdminAccessLogStats,
} from "@/features/admin-access-logs/api/access-logs.server";
import { AccessLogsOverview } from "@/features/admin-access-logs/components/access-logs-overview";
import { AccessLogsTable } from "@/features/admin-access-logs/components/access-logs-table";
import { accessLogsSearchParamsCache } from "@/features/admin-access-logs/query/access-logs-search-params";

type SearchParams = Record<string, string | string[] | undefined>;

export default function AdminStuAccessLogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <AdminPageHeader
        title="Access Logs"
        description="Điều tra traffic, doanh thu và dấu hiệu bất thường mà không can thiệp luồng tracking."
      />
      <Suspense fallback={<AccessLogsPageSkeleton />}>
        <AccessLogsContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function AccessLogsContent({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = accessLogsSearchParamsCache.parse(await searchParams);
  const [result, stats] = await Promise.all([
    getAdminAccessLogs(query),
    getAdminAccessLogStats(),
  ]);
  return (
    <>
      <AccessLogsOverview stats={stats} />
      <AccessLogsTable result={result} query={query} />
    </>
  );
}

function AccessLogsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-xl border bg-muted/30" />
        ))}
      </div>
      <DataTableSkeleton columnCount={10} filterCount={5} shrinkZero />
    </div>
  );
}
