import { CircleAlert, RefreshCcw, ShieldCheck } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/ui";

import type { RewardsDashboardData } from "./types";
import { formatRewardAmount } from "./use-rewards-controller";

export function RewardsInfoAlert() {
  return (
    <Alert className="py-3">
      <ShieldCheck />
      <AlertTitle>Phần thưởng được cộng vào ví hoạt động</AlertTitle>
      <AlertDescription>Phần thưởng đang chờ xác minh có thể cần thêm thời gian trước khi được cộng vào ví.</AlertDescription>
    </Alert>
  );
}

export function RewardsSummary({ data }: { data: RewardsDashboardData }) {
  const metrics = [
    { label: "Số dư thưởng", value: formatRewardAmount(data.summary.availableRewardBalance.amount), description: `${formatRewardAmount(data.summary.pendingRewardBalance.amount)} đang xác minh` },
    { label: "Chuỗi hiện tại", value: `${data.summary.currentStreak} ngày`, description: "Hoạt động liên tiếp" },
    { label: "Thưởng thêm hôm nay", value: data.summary.dailyBonusRate, description: "Áp dụng cho hoạt động đủ điều kiện" },
    { label: "Cột mốc gần nhất", value: data.summary.nextMilestoneLabel, description: "Tiến độ chuỗi hiện tại" },
  ];
  return (
    <section aria-label="Tổng quan phần thưởng" className="grid border-y border-border bg-muted/20 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric, index) => <div key={metric.label} className={cn("px-1 py-4 sm:px-5", index > 0 && "border-t border-border", index === 1 && "sm:border-l sm:border-t-0", index === 3 && "sm:border-l", index > 0 && "xl:border-l xl:border-t-0")}><p className="text-xs font-medium text-muted-foreground">{metric.label}</p><p className="mt-1.5 text-xl font-semibold tracking-[-0.02em] tabular-nums">{metric.value}</p><p className="mt-1 text-xs text-muted-foreground">{metric.description}</p></div>)}
    </section>
  );
}

export function RewardsSkeleton() {
  return <div aria-busy="true" aria-label="Đang tải thông tin phần thưởng" className="space-y-6"><div><Skeleton className="h-8 w-40" /><Skeleton className="mt-2 h-4 w-96 max-w-full" /></div><Skeleton className="h-16 w-full" /><div className="grid border-y border-border sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="p-5"><Skeleton className="h-3 w-24" /><Skeleton className="mt-3 h-7 w-32" /><Skeleton className="mt-2 h-3 w-40" /></div>)}</div><div className="grid gap-5 lg:grid-cols-2"><Skeleton className="h-[420px] rounded-lg" /><Skeleton className="h-[420px] rounded-lg" /></div><Skeleton className="h-80 rounded-lg" /><Skeleton className="h-72 rounded-lg" /></div>;
}

export function RewardsErrorState({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return <div className="space-y-6"><PageHeader title="Phần thưởng" description="Duy trì hoạt động, đạt các cột mốc và nhận thêm phần thưởng." /><Alert variant="destructive"><CircleAlert /><AlertTitle>Không thể tải thông tin phần thưởng.</AlertTitle><AlertDescription><span>{message || "Vui lòng thử lại."}</span><Button variant="outline" size="sm" className="mt-3 border-destructive/30 bg-background text-destructive" onClick={onRetry}><RefreshCcw />Thử lại</Button></AlertDescription></Alert></div>;
}

export function RewardsEmptyState() {
  return <section className="border-y border-border px-4 py-12 text-center"><h2 className="text-lg font-semibold">Bắt đầu hành trình nhận thưởng</h2><p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">Tạo nội dung và duy trì hoạt động để mở khóa các cột mốc đầu tiên.</p><div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row"><Button asChild><a href="/member/links">Tạo Social link</a></Button><Button variant="outline" asChild><a href="/member/bio">Tạo Link-in-bio</a></Button></div></section>;
}
