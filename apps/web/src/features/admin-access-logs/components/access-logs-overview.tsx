"use client";

import { AlertTriangle, CircleDollarSign, MousePointerClick, ShieldAlert, UserCheck, XCircle } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

import type { AccessLogsStats } from "../types";
import { formatMoney } from "./access-logs-table-columns";

const chartConfig = { requests: { label: "Request", color: "var(--primary)" } } satisfies ChartConfig;

export function AccessLogsOverview({ stats }: { stats: AccessLogsStats }) {
  const metrics = [
    ["Request hôm nay", stats.metrics.totalRequests, MousePointerClick],
    ["Được tính revenue", stats.metrics.earnedRequests, UserCheck],
    ["Bị từ chối", stats.metrics.rejectedRequests, XCircle],
    ["Risk cao", stats.metrics.highRiskLogs, ShieldAlert],
    ["Chưa review", stats.metrics.unreviewedLogs, AlertTriangle],
    ["Revenue đáng ngờ", formatMoney(stats.metrics.suspiciousRevenue), CircleDollarSign],
  ] as const;
  return <div className="space-y-4">
    <section className="grid overflow-hidden rounded-xl border bg-card sm:grid-cols-2 xl:grid-cols-6">
      {metrics.map(([label,value,Icon], index) => <article key={label} className={`min-w-0 p-4 ${index ? "border-t sm:border-l sm:border-t-0" : ""}`}><p className="flex items-center justify-between gap-2 text-xs text-muted-foreground">{label}<Icon className="size-4" /></p><p className="mt-3 text-xl font-semibold tabular-nums">{typeof value === "number" ? new Intl.NumberFormat("vi-VN").format(value) : value}</p></article>)}
    </section>
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,.7fr)]">
      <Card><CardHeader><CardTitle>Traffic theo giờ</CardTitle><CardDescription>Access log được tạo từ đầu ngày UTC.</CardDescription></CardHeader><CardContent><ChartContainer config={chartConfig} className="h-56 w-full"><AreaChart data={stats.timeline}><defs><linearGradient id="accessLogsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-requests)" stopOpacity={0.35}/><stop offset="95%" stopColor="var(--color-requests)" stopOpacity={0.02}/></linearGradient></defs><CartesianGrid vertical={false}/><XAxis dataKey="bucket" tickFormatter={(value) => new Date(value).toLocaleTimeString("vi-VN", { hour: "2-digit" })} tickLine={false} axisLine={false}/><YAxis allowDecimals={false} tickLine={false} axisLine={false}/><ChartTooltip content={<ChartTooltipContent />} /><Area dataKey="requestCount" name="requests" type="monotone" stroke="var(--color-requests)" fill="url(#accessLogsFill)" /></AreaChart></ChartContainer></CardContent></Card>
      <Card><CardHeader><CardTitle>Tín hiệu đáng chú ý</CardTitle><CardDescription>Dựa trên mask hiện có, không phải kết luận gian lận.</CardDescription></CardHeader><CardContent className="space-y-4"><TopList title="Top IP" items={stats.topIps.map((item) => [item.ipAddress || "Không có IP", item.requestCount])}/><TopList title="Top user" items={stats.topUsers.map((item) => [item.name, item.requestCount])}/><TopList title="Top link" items={stats.topLinks.map((item) => [item.title, item.requestCount])}/></CardContent></Card>
    </div>
  </div>;
}

function TopList({ title, items }: { title: string; items: Array<[string,number]> }) { return <div><p className="mb-2 text-xs font-medium text-muted-foreground">{title}</p>{items.length ? <div className="space-y-1.5">{items.slice(0,3).map(([label,count]) => <div key={label} className="flex justify-between gap-3 text-sm"><span className="truncate">{label}</span><span className="font-medium tabular-nums">{count}</span></div>)}</div> : <p className="text-sm text-muted-foreground">Chưa có tín hiệu.</p>}</div>; }
