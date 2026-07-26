import { Skeleton } from "@/components/ui/skeleton";

export default function LoyaltyLoading() {
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2"><Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-96 max-w-[70vw]" /></div>
        <Skeleton className="hidden h-9 w-28 sm:block" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
      <Skeleton className="h-96 w-full" />
    </main>
  );
}
