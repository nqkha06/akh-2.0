import { Suspense } from "react"

import { AdminHeader } from "@/components/admin/admin-header"
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import {
  getUsersAccessOptions,
  getUsersTableData,
} from "@/features/admin-users/api/users.server"
import { UsersTable } from "@/features/admin-users/components/users-table"
import { usersSearchParamsCache } from "@/features/admin-users/query/users-search-params"

type SearchParams = Record<string, string | string[] | undefined>

export default function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  return (
    <>
      <AdminHeader title="Users" />
      <main className="flex flex-1 flex-col px-4 py-4 lg:px-6 lg:py-6">
        <Suspense
          fallback={
            <DataTableSkeleton
              columnCount={9}
              filterCount={2}
              cellWidths={["3rem", "18rem", "14rem", "8rem", "10rem"]}
              shrinkZero
            />
          }
        >
          <UsersTableLoader searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  )
}

async function UsersTableLoader({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const search = usersSearchParamsCache.parse(await searchParams)
  const [result, accessOptions] = await Promise.all([
    getUsersTableData(search),
    getUsersAccessOptions(),
  ])

  return <UsersTable {...result} accessOptions={accessOptions} />
}
