import { FilePlus2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { Button } from "@/components/ui/button";
import { getAdminPagesTableData } from "@/features/admin-pages/api/pages.server";
import { PagesTable } from "@/features/admin-pages/components/pages-table";
import { pagesSearchParamsCache } from "@/features/admin-pages/query/pages-search-params";
import { requireAdmin } from "@/lib/auth/guards";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminPagesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { currentUser } = await requireAdmin();
  if (!currentUser.permissions?.includes("pages.read")) redirect("/admin");

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <AdminPageHeader
        title="Pages"
        description="Quản lý trang nội dung, vòng đời xuất bản và metadata SEO."
        actions={
          currentUser.permissions.includes("pages.create") ? (
            <Button asChild>
              <Link href="/admin/pages/create">
                <FilePlus2 /> Tạo Page
              </Link>
            </Button>
          ) : null
        }
      />
      <Suspense
        fallback={
          <DataTableSkeleton
            columnCount={9}
            filterCount={4}
            cellWidths={[
              "3rem",
              "20rem",
              "12rem",
              "9rem",
              "7rem",
              "10rem",
            ]}
            shrinkZero
          />
        }
      >
        <PagesTableLoader searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function PagesTableLoader({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const search = pagesSearchParamsCache.parse(await searchParams);
  const result = await getAdminPagesTableData(search);
  return <PagesTable {...result} />;
}
