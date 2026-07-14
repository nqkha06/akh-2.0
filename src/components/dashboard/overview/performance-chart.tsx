"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { PerformancePoint, PerformanceSummary } from "./types";

type ChartMetric = "visits" | "unlocks" | "conversion";

const metricConfig: Record<ChartMetric, { label: string; suffix?: string }> = {
  visits: { label: "Lượt truy cập" },
  unlocks: { label: "Mở khóa" },
  conversion: { label: "Chuyển đổi", suffix: "%" },
};

const chartConfig = {
  visits: { label: "Lượt truy cập", color: "var(--primary)" },
  unlocks: { label: "Mở khóa", color: "var(--primary)" },
  conversion: { label: "Chuyển đổi", color: "var(--primary)" },
} satisfies ChartConfig;

const numberFormatter = new Intl.NumberFormat("vi-VN");

export function PerformanceChart({
  data,
  summary,
}: {
  data: PerformancePoint[];
  summary: PerformanceSummary;
}) {
  const [metric, setMetric] = useState<ChartMetric>("visits");
  const activeMetric = metricConfig[metric];

  const accessibleSummary = useMemo(
    () => `${activeMetric.label}: ${data.map((point) => `${point.label} ${point[metric]}${activeMetric.suffix ?? ""}`).join(", ")}`,
    [activeMetric, data, metric],
  );

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card" aria-labelledby="performance-title">
      <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <h2 id="performance-title" className="text-base font-semibold tracking-tight text-card-foreground">Hiệu suất</h2>
          <p className="mt-1 text-sm text-muted-foreground">Lượt truy cập và mở khóa theo thời gian</p>
        </div>
        <Tabs value={metric} onValueChange={(value) => setMetric(value as ChartMetric)}>
          <TabsList className="h-10 w-full justify-start overflow-x-auto sm:w-auto" aria-label="Chọn chỉ số biểu đồ">
            <TabsTrigger value="visits" className="min-h-8 px-3">Lượt truy cập</TabsTrigger>
            <TabsTrigger value="unlocks" className="min-h-8 px-3">Mở khóa</TabsTrigger>
            <TabsTrigger value="conversion" className="min-h-8 px-3">Chuyển đổi</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="px-2 pb-1 pt-5 sm:px-5">
        <p className="sr-only">{accessibleSummary}</p>
        <div className="mb-3 flex items-center gap-2 px-2 text-xs text-muted-foreground" aria-hidden="true">
          <span className="size-2 rounded-[2px] bg-primary" />
          {activeMetric.label}
        </div>
        <ChartContainer config={chartConfig} className="h-[260px] w-full min-w-0 aspect-auto sm:h-[320px]">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -14 }} accessibilityLayer>
            <CartesianGrid vertical={false} strokeDasharray="3 5" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={12} minTickGap={24} />
            <YAxis
              domain={metric === "conversion" ? [0, 60] : undefined}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={48}
              tickFormatter={(value: number) => metric === "conversion" ? `${value}%` : value >= 1000 ? `${(value / 1000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}k` : `${value}`}
            />
            <ChartTooltip
              cursor={{ stroke: "var(--border)", strokeDasharray: "3 3" }}
              content={
                <ChartTooltipContent
                  indicator="line"
                  labelFormatter={(_, payload) => payload[0]?.payload?.label}
                  formatter={(value) => (
                    <div className="flex min-w-40 items-center justify-between gap-4">
                      <span className="text-muted-foreground">{activeMetric.label}</span>
                      <span className="font-mono font-medium text-foreground">
                        {metric === "conversion" ? `${Number(value).toLocaleString("vi-VN")}%` : numberFormatter.format(Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Line
              type="monotone"
              dataKey={metric}
              stroke={`var(--color-${metric})`}
              strokeWidth={2.25}
              dot={false}
              activeDot={{ r: 4, fill: "var(--primary)", stroke: "var(--card)", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      </div>

      <dl className="grid grid-cols-3 divide-x divide-border border-t border-border bg-muted/20">
        <div className="px-4 py-3.5 sm:px-5">
          <dt className="text-[11px] text-muted-foreground sm:text-xs">Tổng truy cập</dt>
          <dd className="mt-1 text-sm font-semibold tabular-nums text-foreground sm:text-base">{numberFormatter.format(summary.totalVisits)}</dd>
        </div>
        <div className="px-4 py-3.5 sm:px-5">
          <dt className="text-[11px] text-muted-foreground sm:text-xs">Trung bình/ngày</dt>
          <dd className="mt-1 text-sm font-semibold tabular-nums text-foreground sm:text-base">{numberFormatter.format(summary.dailyAverage)}</dd>
        </div>
        <div className="px-4 py-3.5 sm:px-5">
          <dt className="text-[11px] text-muted-foreground sm:text-xs">Ngày cao nhất</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground sm:text-base">{summary.peakDay}</dd>
        </div>
      </dl>
    </section>
  );
}
