import Link from "next/link";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("Withdraw");
  const { formatCurrency } = useMemberCurrency();
  const metrics = [
    {
      label: t("summary.available"),
      value: data.availableBalance,
      icon: WalletCards,
      accentClassName: "bg-emerald-500",
      iconClassName: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      valueClassName: "text-emerald-700 dark:text-emerald-400",
    },
    {
      label: t("summary.pending"),
      value: data.pendingBalance,
      icon: Clock3,
      accentClassName: "bg-amber-500",
      iconClassName: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      valueClassName: "text-amber-700 dark:text-amber-400",
    },
    {
      label: t("summary.received"),
      value: data.totalReceived,
      icon: CircleDollarSign,
      accentClassName: "bg-sky-500",
      iconClassName: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
      valueClassName: "text-sky-700 dark:text-sky-400",
    },
  ];

  return (
    <section aria-label={t("summary.ariaLabel")} className="grid gap-3 sm:grid-cols-3">
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
  const t = useTranslations("Withdraw");
  if (data.eligibility.eligible) return null;
  const missingPaymentMethod = data.eligibility.reason === "method";
  const reason = data.eligibility.reason ?? "default";
  return (
    <Alert>
      <AlertTriangle />
      <AlertTitle>
        {missingPaymentMethod
          ? t("eligibility.missingMethodTitle")
          : t("eligibility.unavailableTitle")}
      </AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>{data.eligibility.message ?? t(`eligibility.reasons.${reason}`)}</span>
        {data.eligibility.actionHref ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={data.eligibility.actionHref}>
              {data.eligibility.actionLabel ?? (missingPaymentMethod ? t("eligibility.addMethod") : t("eligibility.continue"))}<ArrowUpRight />
            </Link>
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}

export function WithdrawalSkeleton() {
  const t = useTranslations("Withdraw");
  return (
    <PageContainer aria-busy="true" aria-label={t("loadingLabel")}>
      <div><Skeleton className="h-8 w-36" /><Skeleton className="mt-2 h-4 w-[min(28rem,80%)]" /></div>
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-border px-5 py-4">
            <div className="flex items-center justify-between"><Skeleton className="h-4 w-20" /><Skeleton className="size-9 rounded-xl" /></div><Skeleton className="mt-3 h-7 w-36 max-w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-[420px] rounded-xl" />
      <div><Skeleton className="h-6 w-40" /><div className="mt-4 border-t border-border">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="flex h-16 items-center gap-4 border-b border-border"><Skeleton className="h-4 w-28" /><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-24" /></div>)}</div></div>
    </PageContainer>
  );
}

export function WithdrawalErrorState({ message, onRetry }: { message?: string; onRetry: () => void }) {
  const t = useTranslations("Withdraw");
  return (
    <PageContainer>
      <PageHeader title={t("title")} description={t("description")} />
      <Alert variant="destructive">
        <CircleAlert />
        <AlertTitle>{t("errors.loadTitle")}</AlertTitle>
        <AlertDescription>
          <span>{message || t("errors.tryAgainMessage")}</span>
          <Button variant="outline" size="sm" className="mt-3 border-destructive/30 bg-background text-destructive" onClick={onRetry}>
            <RefreshCcw />{t("actions.retry")}
          </Button>
        </AlertDescription>
      </Alert>
    </PageContainer>
  );
}
