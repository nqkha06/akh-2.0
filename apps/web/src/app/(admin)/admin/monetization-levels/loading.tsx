import { Skeleton } from "@/components/ui/skeleton";

export default function MonetizationLevelsLoading() {
  return (
    <main className="flex min-w-0 flex-1 flex-col px-4 py-4 lg:px-6 lg:py-6">
      <div className="mx-auto w-full max-w-[1400px] overflow-hidden rounded-xl border bg-card">
        <div className="flex items-center justify-between gap-4 border-b px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-56 max-w-[60vw]" />
              <Skeleton className="h-4 w-96 max-w-[70vw]" />
            </div>
          </div>
          <Skeleton className="hidden h-9 w-28 sm:block" />
        </div>
        <div className="border-b px-4 py-3 sm:px-6">
          <Skeleton className="h-7 w-[min(32rem,80vw)]" />
        </div>
        <div className="grid gap-6 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-52 w-full" />
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    </main>
  );
}
