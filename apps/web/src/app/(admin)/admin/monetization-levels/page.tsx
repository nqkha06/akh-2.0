import { Suspense } from "react";

import { AdminHeader } from "@/components/admin/admin-header";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { getMonetizationLevelsTableData } from "@/features/admin-monetization-levels/api/monetization-levels.server";
import { MonetizationLevelsTable } from "@/features/admin-monetization-levels/components/monetization-levels-table";
import { monetizationLevelsSearchParamsCache } from "@/features/admin-monetization-levels/query/monetization-levels-search-params";

type SearchParams = Record<string, string | string[] | undefined>;

export default function AdminMonetizationLevelsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <>
      <AdminHeader title="Monetization Levels" />
      <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-primary">
            Monetization configuration
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.6px]">
            Cấp độ kiếm tiền
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Cấu hình lợi nhuận, số bước, trải nghiệm quảng cáo, direct route và
            rate CPM theo từng thị trường.
          </p>
        </div>
        <Suspense
          fallback={
            <DataTableSkeleton
              columnCount={10}
              filterCount={2}
              cellWidths={["3rem", "16rem", "7rem", "5rem", "6rem", "6rem"]}
              shrinkZero
            />
          }
        >
          <MonetizationLevelsLoader searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}

async function MonetizationLevelsLoader({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const search = monetizationLevelsSearchParamsCache.parse(await searchParams);
  const result = await getMonetizationLevelsTableData(search);
  return <MonetizationLevelsTable {...result} />;
}
