import { Suspense } from "react"

import { AdminHeader } from "@/components/admin/admin-header"
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import { getAdminSocialLinksTableData } from "@/features/admin-social-links/api/social-links.server"
import { SocialLinksTable } from "@/features/admin-social-links/components/social-links-table"
import { socialLinksSearchParamsCache } from "@/features/admin-social-links/query/social-links-search-params"

type SearchParams = Record<string, string | string[] | undefined>

export default function AdminSocialLinksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  return (
    <>
      <AdminHeader title="Social Links" />
      <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
        <div>
          <h2 className="font-semibold text-2xl tracking-[-0.6px]">
            Social Links
          </h2>
          
        </div>
        <Suspense
          fallback={
            <DataTableSkeleton
              columnCount={10}
              filterCount={4}
              cellWidths={[
                "3rem",
                "18rem",
                "15rem",
                "8rem",
                "7rem",
                "6rem",
              ]}
              shrinkZero
            />
            }
          >
          <SocialLinksTableLoader searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  )
}

async function SocialLinksTableLoader({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const search = socialLinksSearchParamsCache.parse(await searchParams)
  const result = await getAdminSocialLinksTableData(search)
  return <SocialLinksTable {...result} />
}
