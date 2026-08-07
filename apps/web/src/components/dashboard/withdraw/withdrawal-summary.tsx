import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CircleAlert,
  CircleDollarSign,
  Clock3,
  RefreshCcw,
  WalletCards,
} from "lucide-react";

import { PageContainer, PageHeader } from "@/components/dashboard/ui";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemberCurrency } from "@/features/currencies/components/member-currency-provider";
import { cn } from "@/lib/utils";

import type { WithdrawalDashboardData } from "./types";

export function BalanceSummary({ data }: { data: WithdrawalDashboardData }) {
  const { formatCurrency } = useMemberCurrency();
  const metrics = [
    {
      label: "Có thể rút",
      value: data.availableBalance,
      icon: WalletCards,
      accentClassName: "bg-emerald-500",
      iconClassName: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      valueClassName: "text-emerald-700 dark:text-emerald-400",
    },
    {
      label: "Đang xử lý",
      value: data.pendingBalance,
      icon: Clock3,
      accentClassName: "bg-amber-500",
      iconClassName: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      valueClassName: "text-amber-700 dark:text-amber-400",
    },
    {
      label: "Tổng đã nhận",
      value: data.totalReceived,
      icon: CircleDollarSign,
      accentClassName: "bg-sky-500",
      iconClassName: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
      valueClassName: "text-sky-700 dark:text-sky-400",
    },
  ];

  return (
    <section aria-label="Tổng quan số dư" className="grid gap-3 sm:grid-cols-3">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        const formattedValue = formatCurrency(metric.value, {
          sourceCurrency: data.currency,
        });

        return (
          <article
            key={metric.label}
            className="group relative overflow-hidden rounded-2xl border border-border bg-transparent px-5 py-4 shadow-sm shadow-black/[0.025] transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-border/80 hover:shadow-md hover:shadow-black/[0.04]"
          >
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-x-0 top-0 h-0.5 opacity-80",
                metric.accentClassName,
              )}
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">
                {metric.label}
              </p>
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-xl ring-1 ring-current/10",
                  metric.iconClassName,
                )}
              >
                <Icon className="size-[18px]" strokeWidth={1.9} />
              </span>
            </div>
            <p
              title={formattedValue}
              className={cn(
                "mt-3 truncate text-[1.35rem] font-semibold tracking-[-0.03em] tabular-nums lg:text-2xl",
                metric.valueClassName,
              )}
            >
              {formattedValue}
            </p>
          </article>
        );
      })}
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
    <PageContainer aria-busy="true" aria-label="Đang tải thông tin rút tiền">
      <div><Skeleton className="h-8 w-36" /><Skeleton className="mt-2 h-4 w-[min(28rem,80%)]" /></div>
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-border px-5 py-4">
            <div className="flex items-center justify-between"><Skeleton className="h-4 w-20" /><Skeleton className="size-9 rounded-xl" /></div><Skeleton className="mt-3 h-7 w-36 max-w-full" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.75fr)_minmax(280px,1fr)]">
        <Skeleton className="h-[420px] rounded-xl" /><Skeleton className="h-[420px] rounded-xl" />
      </div>
      <div><Skeleton className="h-6 w-40" /><div className="mt-4 border-t border-border">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="flex h-16 items-center gap-4 border-b border-border"><Skeleton className="h-4 w-28" /><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-24" /></div>)}</div></div>
    </PageContainer>
  );
}

export function WithdrawalErrorState({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <PageContainer>
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
    </PageContainer>
  );
}
