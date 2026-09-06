import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingSystemLogs() {
  return <main className="flex flex-1 flex-col gap-6 p-6"><Skeleton className="h-16" /><div className="grid gap-3 md:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)}</div><Skeleton className="h-[520px]" /></main>;
}
