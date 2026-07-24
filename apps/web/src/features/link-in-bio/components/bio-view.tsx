"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  createBioPage,
  deleteBioPage,
  getBioPages,
  updateBioPage,
  type BioPageDto,
} from "@/lib/api-client"
import { LinkInBioGrid } from "./link-in-bio-grid"
import { PageHeader } from "@/components/dashboard/ui"
import { LinkInBioEmptyState, LinkInBioErrorState, LinkInBioSkeleton } from "./link-in-bio-states"
import { LinkInBioToolbar } from "./link-in-bio-toolbar"
import { bioPageToPayload, getBioCtr, type BioSort, type BioStatusFilter } from "./types"

export function BioView() {
  const [bioPages, setBioPages] = useState<BioPageDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<BioStatusFilter>("all")
  const [sort, setSort] = useState<BioSort>("updated")
  const router = useRouter()

  const loadBioPages = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getBioPages()
      setBioPages(data)
      setError("")
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không tải được danh sách Link-in-bio.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(loadBioPages)
  }, [loadBioPages])

  const visiblePages = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi")
    const filtered = bioPages.filter((page) => {
      const matchesQuery = !normalizedQuery || `${page.name} ${page.slug}`.toLocaleLowerCase("vi").includes(normalizedQuery)
      const matchesStatus = status === "all" || page.status === status
      return matchesQuery && matchesStatus
    })

    return filtered.sort((a, b) => {
      if (sort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sort === "views") return b.views - a.views
      if (sort === "ctr") return getBioCtr(b) - getBioCtr(a)
      if (sort === "name") return a.name.localeCompare(b.name, "vi")
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }, [bioPages, query, sort, status])

  const duplicateBio = async (page: BioPageDto) => {
    try {
      const duplicate = await createBioPage(bioPageToPayload(page, {
        name: `${page.name} (bản sao)`,
        customSlug: undefined,
        status: "draft",
      }))
      setBioPages((current) => [duplicate, ...current])
      toast.success("Đã nhân bản trang dưới dạng bản nháp")
    } catch (duplicateError) {
      toast.error(duplicateError instanceof Error ? duplicateError.message : "Không thể nhân bản trang.")
    }
  }

  const toggleBioStatus = async (page: BioPageDto) => {
    const nextStatus = page.status === "published" ? "draft" : "published"
    try {
      const updated = await updateBioPage(page.id, bioPageToPayload(page, { status: nextStatus }))
      setBioPages((current) => current.map((item) => item.id === updated.id ? updated : item))
      toast.success(nextStatus === "published" ? "Đã xuất bản trang" : "Đã tạm dừng trang")
    } catch (statusError) {
      toast.error(statusError instanceof Error ? statusError.message : "Không thể cập nhật trạng thái.")
    }
  }

  const removeBio = async (page: BioPageDto) => {
    try {
      await deleteBioPage(page.id)
      setBioPages((current) => current.filter((item) => item.id !== page.id))
      toast.success("Đã xóa trang Link-in-bio")
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Không thể xóa trang.")
      throw deleteError
    }
  }

  return (
    <>
      <PageHeader
        title="Link-in-bio"
        description="Tạo và quản lý các trang hồ sơ công khai của bạn."
        action={<Button type="button" onClick={() => router.push("/member/bio/create")} className="h-10 w-full shrink-0 rounded-lg px-4 shadow-none sm:w-auto">Tạo trang</Button>}
      />

      <div className="space-y-5 mt-5">
        {bioPages.length > 0 || loading ? (
          <LinkInBioToolbar
            query={query}
            status={status}
            sort={sort}
            onQueryChange={setQuery}
            onStatusChange={setStatus}
            onSortChange={setSort}
          />
        ) : null}

        {error ? <LinkInBioErrorState message={error} onRetry={() => void loadBioPages()} /> : null}
        {!error && loading ? <LinkInBioSkeleton /> : null}
        {!error && !loading && bioPages.length === 0 ? <LinkInBioEmptyState onCreate={() => router.push("/member/bio/create")} /> : null}
        {!error && !loading && bioPages.length > 0 && visiblePages.length === 0 ? (
          <div className="grid min-h-52 place-items-center rounded-xl border border-dashed border-border bg-card px-6 text-center">
            <div><p className="text-sm font-medium text-foreground">Không tìm thấy trang phù hợp</p><p className="mt-1 text-xs text-muted-foreground">Thử từ khóa hoặc trạng thái khác.</p><Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => { setQuery(""); setStatus("all") }}>Xóa bộ lọc</Button></div>
          </div>
        ) : null}
        {!error && !loading && visiblePages.length > 0 ? (
          <LinkInBioGrid pages={visiblePages} onEdit={(page) => router.push(`/member/bio/${page.id}/edit`)} onDuplicate={(page) => void duplicateBio(page)} onToggleStatus={(page) => void toggleBioStatus(page)} onDelete={removeBio} />
        ) : null}
      </div>
    </>
  )
}
