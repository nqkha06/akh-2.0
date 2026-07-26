import { PageContainer } from "@/components/dashboard/ui"
import { Skeleton } from "@/components/ui/skeleton"

export default function MemberPageLoading() {
  return (
    <PageContainer aria-busy="true" aria-label="Đang tải nội dung">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-full sm:w-32" />
      </div>

      <div className="grid overflow-hidden rounded-xl border border-border sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="space-y-3 border-b border-border p-5 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0 sm:p-6"
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.65fr)]">
        <Skeleton className="h-[420px] rounded-xl" />
        <Skeleton className="h-[320px] rounded-xl" />
      </div>
    </PageContainer>
  )
}
