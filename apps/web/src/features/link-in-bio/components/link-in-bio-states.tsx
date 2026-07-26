import { Plus, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export function LinkInBioEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="grid min-h-72 place-items-center rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid size-11 place-items-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
          <UserRound className="size-5" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-foreground">Bạn chưa có trang Link-in-bio</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Tạo một trang để chia sẻ liên kết, mạng xã hội và nội dung từ một địa chỉ duy nhất.</p>
        <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
          <Button type="button" onClick={onCreate} className="h-10 rounded-lg shadow-none"><Plus className="size-4" />Tạo trang đầu tiên</Button>
        </div>
      </div>
    </div>
  )
}

export function LinkInBioSkeleton() {
  return (
    <div className="grid gap-4 min-[1280px]:grid-cols-2">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="h-[236px] overflow-hidden rounded-xl border border-border bg-card p-5">
          <Skeleton className="h-1 w-full rounded-none" />
          <div className="mt-4 flex justify-between gap-4"><div className="space-y-2"><Skeleton className="h-5 w-36" /><Skeleton className="h-4 w-48" /></div><Skeleton className="h-6 w-24" /></div>
          <Skeleton className="mt-5 h-4 w-56" />
          <div className="mt-5 grid grid-cols-3 gap-4"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
          <div className="mt-5 flex items-center justify-between border-t border-border pt-4"><Skeleton className="h-4 w-28" /><Skeleton className="h-9 w-28" /></div>
        </div>
      ))}
    </div>
  )
}

export function LinkInBioErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-sm">
      <p className="text-destructive">{message}</p>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>Thử lại</Button>
    </div>
  )
}
