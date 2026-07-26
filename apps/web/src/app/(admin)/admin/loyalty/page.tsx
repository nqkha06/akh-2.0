import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { Button } from "@/components/ui/button";
import { getLoyaltyTiersTableData } from "@/features/admin-loyalty-tiers/api/loyalty-tiers.server";
import { LoyaltyTiersTable } from "@/features/admin-loyalty-tiers/components/loyalty-tiers-table";
import { loyaltyTiersSearchParamsCache } from "@/features/admin-loyalty-tiers/query/loyalty-tiers-search-params";
import { requireAdmin } from "@/lib/auth/guards";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminLoyaltyPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { currentUser } = await requireAdmin();

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <AdminPageHeader
        title="Loyalty Tiers"
        description="Quản lý ngưỡng lượt xem 7 ngày, nội dung đa ngôn ngữ và danh sách quyền lợi tích/X hiển thị cho thành viên."
        actions={
          currentUser.permissions?.includes("loyalty-tiers.create") ? (
            <Button asChild>
              <Link href="/admin/loyalty/create"><Plus /> Thêm hạng</Link>
            </Button>
          ) : null
        }
      />
      <Suspense
        fallback={
          <DataTableSkeleton
            columnCount={7}
            filterCount={2}
            cellWidths={["16rem", "9rem", "7rem", "5rem", "7rem"]}
            shrinkZero
          />
        }
      >
        <LoyaltyTiersLoader searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function LoyaltyTiersLoader({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const search = loyaltyTiersSearchParamsCache.parse(await searchParams);
  const result = await getLoyaltyTiersTableData(search);
  return <LoyaltyTiersTable {...result} />;
}
