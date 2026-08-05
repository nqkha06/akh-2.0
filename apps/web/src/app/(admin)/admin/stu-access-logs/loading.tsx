import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";

export default function AdminAccessLogsLoading() {
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <div className="h-24 animate-pulse rounded-xl bg-muted/40" />
      <DataTableSkeleton columnCount={10} filterCount={5} shrinkZero />
    </main>
  );
}
