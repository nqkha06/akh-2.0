"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza"
import {
  createBioPage,
  getBioPages,
  updateBioPage,
  type BioPageDto,
} from "@/lib/api-client"
import LinkInBioGenerator from "./link-in-bio-generator"
import { LinkInBioGrid } from "./components/link-in-bio-grid"
import { LinkInBioHeader } from "./components/link-in-bio-header"
import { LinkInBioEmptyState, LinkInBioErrorState, LinkInBioSkeleton } from "./components/link-in-bio-states"
import { LinkInBioToolbar } from "./components/link-in-bio-toolbar"
import { bioPageToPayload, getBioCtr, type BioSort, type BioStatusFilter } from "./components/types"

export function BioView() {
  const [bioPages, setBioPages] = useState<BioPageDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [creating, setCreating] = useState(false)
  const [editingBio, setEditingBio] = useState<BioPageDto | null>(null)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<BioStatusFilter>("all")
  const [sort, setSort] = useState<BioSort>("updated")

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

  const handleBioSaved = (bioPage: BioPageDto) => {
    setBioPages((current) => [bioPage, ...current.filter((item) => item.id !== bioPage.id)])
    setCreating(false)
    setEditingBio(null)
  }

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

  return (
    <>
      <LinkInBioHeader onCreate={() => setCreating(true)} />

      <div className="space-y-5">
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
        {!error && !loading && bioPages.length === 0 ? <LinkInBioEmptyState onCreate={() => setCreating(true)} /> : null}
        {!error && !loading && bioPages.length > 0 && visiblePages.length === 0 ? (
          <div className="grid min-h-52 place-items-center rounded-xl border border-dashed border-border bg-card px-6 text-center">
            <div><p className="text-sm font-medium text-foreground">Không tìm thấy trang phù hợp</p><p className="mt-1 text-xs text-muted-foreground">Thử từ khóa hoặc trạng thái khác.</p><Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => { setQuery(""); setStatus("all") }}>Xóa bộ lọc</Button></div>
          </div>
        ) : null}
        {!error && !loading && visiblePages.length > 0 ? (
          <LinkInBioGrid pages={visiblePages} onEdit={setEditingBio} onDuplicate={(page) => void duplicateBio(page)} onToggleStatus={(page) => void toggleBioStatus(page)} />
        ) : null}
      </div>

      <Credenza open={creating} onOpenChange={setCreating}>
        <CredenzaContent className="sm:max-w-6xl">
          <CredenzaHeader className="border-b border-border">
            <CredenzaTitle>Tạo trang Link-in-bio</CredenzaTitle>
            <CredenzaDescription>Tạo một hồ sơ công khai mới cho liên kết, mạng xã hội và widget của bạn.</CredenzaDescription>
          </CredenzaHeader>
          <CredenzaBody className="bg-muted/20 px-4 py-5 sm:px-6">
            <LinkInBioGenerator key="create-bio" showHeader={false} onSaved={handleBioSaved} />
          </CredenzaBody>
        </CredenzaContent>
      </Credenza>

      <Credenza open={Boolean(editingBio)} onOpenChange={(open) => !open && setEditingBio(null)}>
        <CredenzaContent className="sm:max-w-6xl">
          <CredenzaHeader className="border-b border-border">
            <CredenzaTitle>Chỉnh sửa Link-in-bio</CredenzaTitle>
            <CredenzaDescription>Cập nhật nội dung, giao diện và media của /b/{editingBio?.slug}.</CredenzaDescription>
          </CredenzaHeader>
          <CredenzaBody className="bg-muted/20 px-4 py-5 sm:px-6">
            {editingBio ? <LinkInBioGenerator key={editingBio.id} showHeader={false} initialBio={editingBio} onSaved={handleBioSaved} /> : null}
          </CredenzaBody>
        </CredenzaContent>
      </Credenza>
    </>
  )
}
