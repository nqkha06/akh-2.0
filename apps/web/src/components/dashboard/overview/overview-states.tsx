import Link from "next/link";
import { AlertCircle, BarChart3, BookOpen, Check, Plus, RotateCcw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function OverviewEmptyState() {
  return (
    <section className="rounded-xl border border-border bg-card px-5 py-10 text-center sm:px-8 sm:py-14" aria-labelledby="empty-overview-title">
      <div className="mx-auto grid size-12 place-items-center rounded-lg border border-border bg-muted/40 text-primary">
        <BarChart3 className="size-5" aria-hidden="true" />
      </div>
      <h2 id="empty-overview-title" className="mt-5 text-lg font-semibold tracking-tight text-card-foreground">Bạn chưa có nội dung nào</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        Tạo social link, file, link-in-bio hoặc unlock link đầu tiên để bắt đầu theo dõi lượt truy cập và chuyển đổi.
      </p>
      <div className="mx-auto mt-6 flex max-w-sm flex-col gap-2 sm:flex-row sm:justify-center">
        <Button className="h-11" asChild><Link href="/member/create"><Plus />Tạo nội dung đầu tiên</Link></Button>
        <Button variant="outline" className="h-11 bg-background shadow-none" asChild><Link href="/member/support"><BookOpen />Xem hướng dẫn</Link></Button>
      </div>
      <ol className="mx-auto mt-8 grid max-w-2xl gap-3 border-t border-border pt-6 text-left sm:grid-cols-3">
        {["Tạo nội dung", "Chia sẻ link", "Theo dõi hiệu suất"].map((step, index) => (
          <li key={step} className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <span className="grid size-6 shrink-0 place-items-center rounded-full border border-border bg-background text-xs font-medium text-foreground">
              {index === 0 ? <Check className="size-3" aria-hidden="true" /> : index + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </section>
  );
}

export function OverviewSkeleton({ includeHeader = false }: { includeHeader?: boolean }) {
  return (
    <div className="space-y-7" aria-label="Đang tải dữ liệu tổng quan" aria-busy="true">
      {includeHeader ? (
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2"><Skeleton className="h-8 w-44" /><Skeleton className="h-4 w-80 max-w-full" /></div>
          <Skeleton className="hidden h-11 w-44 sm:block" />
        </div>
      ) : null}
      <div className="grid grid-cols-2 border-y border-border lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className={`space-y-3 px-4 py-5 ${index % 2 ? "border-l" : ""} ${index > 1 ? "border-t lg:border-t-0" : ""} ${index > 0 ? "lg:border-l" : ""}`}>
            <Skeleton className="h-3 w-24" /><Skeleton className="h-7 w-32" /><Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.85fr)_minmax(300px,1fr)]">
        <div className="rounded-xl border border-border p-5"><Skeleton className="h-5 w-28" /><Skeleton className="mt-2 h-4 w-56" /><Skeleton className="mt-8 h-[260px] w-full" /></div>
        <div className="rounded-xl border border-border p-5"><Skeleton className="h-5 w-36" />{Array.from({ length: 4 }).map((_, index) => <div key={index} className="mt-5 space-y-2"><Skeleton className="h-4 w-36" /><Skeleton className="h-2 w-full" /></div>)}</div>
      </div>
      <div className="rounded-xl border border-border p-5"><Skeleton className="h-5 w-48" />{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="mt-4 h-11 w-full" />)}</div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,1fr)]">{[0, 1].map((item) => <div key={item} className="rounded-xl border border-border p-5"><Skeleton className="h-5 w-36" />{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="mt-4 h-12 w-full" />)}</div>)}</div>
    </div>
  );
}

export function OverviewErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert variant="destructive" className="grid-cols-[1rem_1fr_auto] items-center gap-x-3 px-4 py-4">
      <AlertCircle aria-hidden="true" />
      <div>
        <AlertTitle>Không thể tải dữ liệu tổng quan.</AlertTitle>
        <AlertDescription>Vui lòng thử lại.</AlertDescription>
      </div>
      <Button variant="outline" size="sm" className="col-start-2 mt-3 border-destructive/30 bg-background text-destructive shadow-none hover:bg-destructive/10 md:col-start-3 md:row-start-1 md:mt-0" onClick={onRetry}>
        <RotateCcw aria-hidden="true" />Thử lại
      </Button>
    </Alert>
  );
}
