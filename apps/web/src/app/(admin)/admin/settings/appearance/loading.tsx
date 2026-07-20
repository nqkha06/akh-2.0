import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingAppearanceSettings() {
  return (
    <main className="space-y-6 px-4 py-4 lg:px-6 lg:py-6">
        <Skeleton className="h-16 w-96 max-w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[480px] w-full" />
      </main>
  );
}
