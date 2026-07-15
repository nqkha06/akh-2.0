"use client"

import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { BioSort, BioStatusFilter } from "./types"

export function LinkInBioToolbar({
  query,
  status,
  sort,
  onQueryChange,
  onStatusChange,
  onSortChange,
}: {
  query: string
  status: BioStatusFilter
  sort: BioSort
  onQueryChange: (value: string) => void
  onStatusChange: (value: BioStatusFilter) => void
  onSortChange: (value: BioSort) => void
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center" role="search">
      <label className="relative min-w-0 flex-1 lg:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Tìm theo tên hoặc slug..."
          aria-label="Tìm theo tên hoặc slug"
          className="h-10 rounded-lg border-border bg-background pl-9 shadow-none"
        />
      </label>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:ml-auto">
        <Select value={status} onValueChange={(value) => onStatusChange(value as BioStatusFilter)}>
          <SelectTrigger className="h-10 w-full rounded-lg border-border bg-background shadow-none sm:w-44" aria-label="Lọc trạng thái">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="published">Đã xuất bản</SelectItem>
            <SelectItem value="draft">Bản nháp</SelectItem>
            <SelectItem value="paused">Đã tạm dừng</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(value) => onSortChange(value as BioSort)}>
          <SelectTrigger className="h-10 w-full rounded-lg border-border bg-background shadow-none sm:w-48" aria-label="Sắp xếp trang">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">Mới cập nhật</SelectItem>
            <SelectItem value="oldest">Cũ nhất</SelectItem>
            <SelectItem value="views">Nhiều lượt xem nhất</SelectItem>
            <SelectItem value="ctr">CTR cao nhất</SelectItem>
            <SelectItem value="name">Tên A–Z</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
