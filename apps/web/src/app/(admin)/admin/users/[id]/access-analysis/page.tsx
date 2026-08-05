import { notFound } from "next/navigation";

import {
  getUserAccessAnalysis,
  getUserAccessLogs,
} from "@/features/admin-access-logs/api/access-logs.server";
import { UserAccessAnalysisView } from "@/features/admin-access-logs/components/user-access-analysis";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function UserAccessAnalysisPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SearchParams> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const userId = Number(id);
  if (!Number.isSafeInteger(userId) || userId < 1) notFound();
  const range = typeof query.range === "string" ? query.range : "24h";
  const period = resolvePeriod(range, query.from, query.to);
  const logPage = typeof query.logPage === "string" ? Math.max(1, Number(query.logPage) || 1) : 1;
  const [analysis, logs] = await Promise.all([
    getUserAccessAnalysis(userId, period),
    getUserAccessLogs(userId, { ...period, page: logPage }),
  ]);
  return <main className="flex min-w-0 flex-1 flex-col px-4 py-4 lg:px-6 lg:py-6"><UserAccessAnalysisView analysis={analysis} logs={logs} range={range} /></main>;
}

function resolvePeriod(range: string, fromInput: string | string[] | undefined, toInput: string | string[] | undefined) {
  if (range === "custom" && typeof fromInput === "string" && typeof toInput === "string") return { from: fromInput, to: toInput };
  const hours = range === "30d" ? 720 : range === "7d" ? 168 : 24;
  const to = new Date();
  return { from: new Date(to.getTime() - hours * 60 * 60 * 1_000).toISOString(), to: to.toISOString() };
}
