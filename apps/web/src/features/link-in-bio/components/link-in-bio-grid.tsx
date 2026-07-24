import type { BioPageDto } from "@/lib/api-client"
import { LinkInBioCard } from "./link-in-bio-card"

export function LinkInBioGrid({
  pages,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onDelete,
}: {
  pages: BioPageDto[]
  onEdit: (page: BioPageDto) => void
  onDuplicate: (page: BioPageDto) => void
  onToggleStatus: (page: BioPageDto) => void
  onDelete: (page: BioPageDto) => Promise<void>
}) {
  return (
    <div className="grid grid-cols-1 gap-4 min-[1280px]:grid-cols-2">
      {pages.map((page) => <LinkInBioCard key={page.id} page={page} onEdit={onEdit} onDuplicate={onDuplicate} onToggleStatus={onToggleStatus} onDelete={onDelete} />)}
    </div>
  )
}
