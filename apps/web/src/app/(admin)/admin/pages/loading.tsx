import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";

export default function AdminPagesLoading() {
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
        <div className="h-16 animate-pulse rounded-lg bg-muted/40" />
        <DataTableSkeleton
          columnCount={9}
          filterCount={4}
          cellWidths={["3rem", "20rem", "12rem", "9rem", "10rem"]}
          shrinkZero
        />
      </main>
  );
}
