import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CircleAlert, RefreshCcw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/ui";

import type { WithdrawalDashboardData } from "./types";
import { formatCurrency } from "./use-withdrawal-controller";

export function BalanceSummary({ data }: { data: WithdrawalDashboardData }) {
  const metrics = [
    {
      label: "Có thể rút",
      value: data.availableBalance,
      description: "Có thể tạo yêu cầu rút ngay",
    },
    {
      label: "Đang xử lý",
      value: data.pendingBalance,
      description: "Các yêu cầu đang được xử lý",
    },
    {
      label: "Tổng đã nhận",
      value: data.totalReceived,
      description: "Tổng tiền đã thanh toán",
    },
  ];

  return (
    <section aria-label="Tổng quan số dư" className="grid border-y border-border bg-muted/20 sm:grid-cols-3">
      {metrics.map((metric, index) => (
        <div
          key={metric.label}
          className={cn(
            "px-1 py-4 sm:px-5 sm:py-5",
            index > 0 && "border-t border-border sm:border-l sm:border-t-0",
          )}
        >
          <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
          <p className="mt-1.5 text-xl font-semibold tracking-[-0.02em] tabular-nums text-foreground lg:text-2xl">
            {formatCurrency(metric.value)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{metric.description}</p>
        </div>
      ))}
    </section>
  );
}

export function WithdrawalEligibilityAlert({ data }: { data: WithdrawalDashboardData }) {
  if (data.eligibility.eligible) return null;
  return (
    <Alert>
      <AlertTriangle />
      <AlertTitle>Bạn chưa đủ điều kiện rút tiền</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>{data.eligibility.message ?? "Vui lòng hoàn tất các yêu cầu tài khoản trước khi tiếp tục."}</span>
        {data.eligibility.actionHref && data.eligibility.actionLabel ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={data.eligibility.actionHref}>
              {data.eligibility.actionLabel}<ArrowUpRight />
            </Link>
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}

export function WithdrawalSkeleton() {
  return (
    <div aria-busy="true" aria-label="Đang tải thông tin rút tiền" className="space-y-6">
      <div><Skeleton className="h-8 w-36" /><Skeleton className="mt-2 h-4 w-[min(28rem,80%)]" /></div>
      <div className="grid border-y border-border py-5 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className={cn("px-1 py-3 sm:px-5", index > 0 && "border-t border-border sm:border-l sm:border-t-0")}>
            <Skeleton className="h-3 w-20" /><Skeleton className="mt-3 h-7 w-36" /><Skeleton className="mt-2 h-3 w-44 max-w-full" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.75fr)_minmax(280px,1fr)]">
        <Skeleton className="h-[420px] rounded-lg" /><Skeleton className="h-[420px] rounded-lg" />
      </div>
      <div><Skeleton className="h-6 w-40" /><div className="mt-4 border-t border-border">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="flex h-16 items-center gap-4 border-b border-border"><Skeleton className="h-4 w-28" /><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-24" /></div>)}</div></div>
    </div>
  );
}

export function WithdrawalErrorState({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <div className="space-y-6">
      <PageHeader title="Rút tiền" description="Chuyển số dư khả dụng về phương thức thanh toán của bạn." />
      <Alert variant="destructive">
        <CircleAlert />
        <AlertTitle>Không thể tải thông tin rút tiền.</AlertTitle>
        <AlertDescription>
          <span>{message || "Vui lòng thử lại."}</span>
          <Button variant="outline" size="sm" className="mt-3 border-destructive/30 bg-background text-destructive" onClick={onRetry}>
            <RefreshCcw />Thử lại
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
