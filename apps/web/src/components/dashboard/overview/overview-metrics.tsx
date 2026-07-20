import { ArrowDownRight, ArrowUpRight, Info } from "lucide-react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type { MetricFormat, OverviewMetric } from "./types";

const numberFormatter = new Intl.NumberFormat("vi-VN");
const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

function formatValue(value: number, format: MetricFormat) {
  if (format === "currency") return currencyFormatter.format(value);
  if (format === "percent") return `${value.toLocaleString("vi-VN")}%`;
  return numberFormatter.format(value);
}

function Sparkline({ values, trend }: { values: number[]; trend: OverviewMetric["trend"] }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const points = values
    .map((value, index) => `${(index / (values.length - 1)) * 88},${30 - ((value - min) / range) * 24}`)
    .join(" ");

  return (
    <svg viewBox="0 0 88 36" className="h-9 w-[5.5rem]" role="img" aria-label={`Xu hướng ${trend === "up" ? "tăng" : "giảm"}`}>
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={trend === "up" ? "text-[var(--overview-success)]" : "text-destructive"}
      />
    </svg>
  );
}

export function OverviewMetrics({ metrics }: { metrics: OverviewMetric[] }) {
  return (
    <TooltipProvider>
      <section aria-label="Chỉ số tổng quan" className="border rounded-lg border-border bg-card">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => {
            const TrendIcon = metric.trend === "up" ? ArrowUpRight : ArrowDownRight;
            return (
              <div
                key={metric.id}
                className={`relative min-w-0 px-3 py-5 sm:px-5 lg:px-6 ${index % 2 === 1 ? "border-l border-border" : ""} ${index > 1 ? "border-t border-border lg:border-t-0" : ""} ${index > 0 ? "lg:border-l lg:border-border" : "lg:border-l-0"}`}
              >
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <span>{metric.label}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Giải thích ${metric.label}`}>
                        <Info className="size-3.5" aria-hidden="true" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-64">{metric.hint}</TooltipContent>
                  </Tooltip>
                </div>
                <div className="mt-3 flex min-w-0 items-end justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xl font-semibold tracking-[-0.025em] text-foreground sm:text-2xl">
                      {formatValue(metric.value, metric.format)}
                    </p>
                    <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${metric.trend === "up" ? "text-[var(--overview-success)]" : "text-destructive"}`}>
                      <TrendIcon className="size-3.5" aria-hidden="true" />
                      <span>{metric.change.toLocaleString("vi-VN")}%</span>
                      <span className="hidden font-normal text-muted-foreground sm:inline">so với kỳ trước</span>
                    </div>
                  </div>
                  <div className="hidden shrink-0 2xl:block"><Sparkline values={metric.sparkline} trend={metric.trend} /></div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </TooltipProvider>
  );
}
