import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { Button } from "@/components/ui/button";
import { getMonetizationLevelsTableData } from "@/features/admin-monetization-levels/api/monetization-levels.server";
import { MonetizationLevelsTable } from "@/features/admin-monetization-levels/components/monetization-levels-table";
import { monetizationLevelsSearchParamsCache } from "@/features/admin-monetization-levels/query/monetization-levels-search-params";
import { requireAdmin } from "@/lib/auth/guards";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminMonetizationLevelsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { currentUser } = await requireAdmin();

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <AdminPageHeader
        title="Cấp độ kiếm tiền"
        description="Cấu hình lợi nhuận, số bước, trải nghiệm quảng cáo, direct route và rate CPM theo từng thị trường."
        actions={
          currentUser.permissions?.includes("monetization-levels.create") ? (
            <Button asChild>
              <Link href="/admin/monetization-levels/create">
                <Plus /> Thêm cấp độ
              </Link>
            </Button>
          ) : null
        }
      />
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
