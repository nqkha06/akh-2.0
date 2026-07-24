import { Plus } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import { Button } from "@/components/ui/button"
import {
  getUsersAccessOptions,
  getUsersTableData,
} from "@/features/admin-users/api/users.server"
import { UsersTable } from "@/features/admin-users/components/users-table"
import { usersSearchParamsCache } from "@/features/admin-users/query/users-search-params"
import { requireAdmin } from "@/lib/auth/guards"
import { redirect } from "next/navigation"

type SearchParams = Record<string, string | string[] | undefined>

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { currentUser } = await requireAdmin()
  if (!currentUser.permissions?.includes("users.read")) {
    redirect("/admin")
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <AdminPageHeader
        title="Users"
        description="Quản lý tài khoản, trạng thái và phạm vi truy cập của người dùng."
        actions={
          currentUser.permissions.includes("users.create") ? (
            <Button asChild>
              <Link href="/admin/users/create">
                <Plus /> Tạo User
              </Link>
            </Button>
          ) : null
        }
      />
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
