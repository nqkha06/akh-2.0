import { Skeleton } from "@/components/ui/skeleton";

export default function AdminSettingsLoading() {
  return (
    <main className="flex min-w-0 flex-1 px-4 py-4 lg:px-6 lg:py-6">
      <div className="mx-auto w-full max-w-[1240px] space-y-6">
        <Skeleton className="h-16 w-96 max-w-full" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-[420px] rounded-xl" />
      </div>
    </main>
  );
}
