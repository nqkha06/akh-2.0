"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState, useTransition, type ReactNode } from "react"
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  Eye,
  Globe2,
  Link2,
  Monitor,
  MousePointerClick,
  Smartphone,
  Tablet,
  TrendingDown,
  TrendingUp,
  Minus,
  type LucideIcon,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Button } from "@/components/ui/button"
import { PageContainer, PageHeader } from "@/components/dashboard/ui"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useMemberCurrency } from "@/features/currencies/components/member-currency-provider"
import { cn } from "@/lib/utils"

import {
  memberDashboardRanges,
  type MemberDashboardRange,
  type MemberDashboardBreakdownItem,
  type MemberDashboardData,
} from "../types"

type ChartMetric = "successfulOpens" | "revenue"

const chartConfig = {
  successfulOpens: {
    label: "Lượt vượt",
    color: "var(--primary)",
  },
  revenue: {
    label: "Doanh thu",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function MemberDashboard({
  data,
  range,
}: {
  data: MemberDashboardData
  range: MemberDashboardRange
}) {
  const t = useTranslations("MemberDashboard")
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isRangePending, startRangeTransition] = useTransition()
  const { formatCurrency } = useMemberCurrency()
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale])
  const percentageFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }),
    [locale],
  )
  const metricChange = (value: number | null) => ({
    label: value === null
      ? "—"
      : `${value > 0 ? "+" : ""}${percentageFormatter.format(value)}%`,
    direction: value === null || value === 0
      ? "neutral" as const
      : value > 0
        ? "up" as const
        : "down" as const,
    description: t("metrics.comparedWithPreviousPeriod"),
  })
  const metrics = [
    {
      label: t("metrics.earnings"),
      value: formatCurrency(data.analytics.metrics.revenue),
      icon: CircleDollarSign,
      change: metricChange(data.analytics.changes?.revenue ?? null),
    },
    {
      label: t("metrics.views"),
      value: numberFormatter.format(data.analytics.metrics.successfulOpens),
      icon: MousePointerClick,
      change: metricChange(data.analytics.changes?.successfulOpens ?? null),
    },
    {
      label: t("metrics.earnedViews"),
      value: numberFormatter.format(data.analytics.metrics.earnedViews),
      icon: Eye,
      change: metricChange(data.analytics.changes?.earnedViews ?? null),
    },
    {
      label: t("metrics.averageCpm"),
      value: formatCurrency(data.analytics.metrics.averageCpm),
      icon: BarChart3,
      change: metricChange(data.analytics.changes?.averageCpm ?? null),
    },
  ] as const
  function handleRangeChange(value: string) {
    if (!memberDashboardRanges.includes(value as MemberDashboardRange)) return
    if (value === range) return

    const params = new URLSearchParams(searchParams.toString())
    if (value === "30d") params.delete("range")
    else params.set("range", value)

    const query = params.toString()
    startRangeTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname)
    })
  }

  return (
    <PageContainer>
      <PageHeader
        title={t("title")}
        action={
          <Select
            value={range}
            onValueChange={handleRangeChange}
            disabled={isRangePending}
          >
            <SelectTrigger
              className="h-10 rounded-lg bg-background shadow-none"
              aria-label={t("range.label")}
            >
              <CalendarDays className="size-4" aria-hidden="true" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {memberDashboardRanges.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`range.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <section
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
        aria-label={t("metrics.label", { days: data.analytics.periodDays })}
      >
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.65fr)]">
        <div className="min-w-0 space-y-5">
          <PerformanceCard data={data} />
          <DailyPerformanceTable data={data} />
        </div>

        <aside className="grid min-w-0 gap-5 sm:grid-cols-2 xl:grid-cols-1">
          <TopLinks data={data} />
          <BreakdownCard
            title={t("breakdowns.countries")}
            icon={Globe2}
            items={data.analytics.breakdowns.countries}
            renderLabel={(key) => <CountryLabel code={key} locale={locale} />}
          />
          <BreakdownCard
            title={t("breakdowns.devices")}
            icon={Monitor}
            items={data.analytics.breakdowns.devices}
            renderLabel={(key) => (
              <span className="flex items-center gap-2">
                <DeviceIcon value={key} />
                {deviceLabel(key, t)}
              </span>
            )}
          />
          <BreakdownCard
            title={t("breakdowns.browsers")}
            icon={BarChart3}
            items={data.analytics.breakdowns.browsers}
            renderLabel={(key) => browserLabel(key, t)}
          />
        </aside>
      </div>
    </PageContainer>
  )
}

export function MemberDashboardSkeleton() {
  return (
    <PageContainer aria-busy="true">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-52" />
        </div>
        <div className="hidden sm:block">
          <Skeleton className="h-10 w-44" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="flex min-h-28 items-center justify-between gap-5 rounded-xl border border-border bg-card p-5"
          >
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-3 h-8 w-24" />
            </div>
            <Skeleton className="size-11 shrink-0 rounded-xl" />
          </div>
        ))}
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.65fr)]">
        <div className="space-y-5">
          <Skeleton className="h-[360px] rounded-xl" />
          <Skeleton className="h-[720px] rounded-xl" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    </PageContainer>
  )
}

function MetricCard({
  label,
  value,
  icon: Icon,
  change,
}: {
  label: string
  value: string
  icon: LucideIcon
  change?: {
    label: string
    direction: "up" | "down" | "neutral"
    description: string
  }
}) {
  return (
    <article className="flex min-h-28 min-w-0 items-center justify-between gap-5 rounded-xl border border-border bg-card p-5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium leading-5 text-muted-foreground">{label}</p>
        <div className="mt-2 flex min-w-0 items-baseline gap-2">
          <p className="min-w-0 truncate text-[24px] font-semibold leading-none tracking-[-0.04em] tabular-nums text-foreground 2xl:text-[26px]">
            {value}
          </p>
          {change ? (
            <span
              aria-label={`${change.description}: ${change.label}`}
              className={cn(
                "inline-flex shrink-0 items-center gap-1 text-xs font-medium tabular-nums",
                change.direction === "up" && "text-emerald-600 dark:text-emerald-400",
                change.direction === "down" && "text-destructive",
                change.direction === "neutral" && "text-muted-foreground",
              )}
              title={change.description}
            >
              {change.direction === "up" ? <TrendingUp className="size-3.5" aria-hidden="true" /> : null}
              {change.direction === "down" ? <TrendingDown className="size-3.5" aria-hidden="true" /> : null}
              {change.direction === "neutral" ? <Minus className="size-3.5" aria-hidden="true" /> : null}
              {change.label}
            </span>
          ) : null}
        </div>
      </div>
      <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-muted/35 text-primary">
        <Icon className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
      </span>
    </article>
  )
}

function PerformanceCard({ data }: { data: MemberDashboardData }) {
  const t = useTranslations("MemberDashboard")
  const locale = useLocale()
  const { formatCurrency } = useMemberCurrency()
  const [metric, setMetric] = useState<ChartMetric>("successfulOpens")
  const hasData = data.analytics.series.some((item) => item[metric] > 0)

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="flex flex-col gap-3 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <CardTitle className="text-base tracking-[-0.02em]">
          {t("performance.title")}
        </CardTitle>
        <div className="flex rounded-lg border border-border bg-muted/20 p-1">
          {(["successfulOpens", "revenue"] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={cn(
                "h-8 rounded-md px-3 text-xs font-medium text-muted-foreground transition-colors",
                metric === value && "bg-background text-foreground",
              )}
              onClick={() => setMetric(value)}
            >
              {t(`performance.${value}`)}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-4 pt-5 sm:px-5">
        {hasData ? (
          <ChartContainer
            config={chartConfig}
            className="h-[280px] w-full"
            initialDimension={{ width: 760, height: 280 }}
          >
            <AreaChart data={data.analytics.series} margin={{ left: 0, right: 12 }}>
              <defs>
                <linearGradient id="memberPerformanceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={`var(--color-${metric})`} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={`var(--color-${metric})`} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                minTickGap={28}
                tickMargin={10}
                tickFormatter={(value) => formatShortDate(String(value), locale)}
              />
              <YAxis
                allowDecimals={metric === "revenue"}
                tickLine={false}
                axisLine={false}
                width={44}
                tickFormatter={(value) =>
                  metric === "revenue"
                    ? compactCurrency(Number(value), locale)
                    : String(value)
                }
              />
              <ChartTooltip
                cursor={{ stroke: "var(--border)" }}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    labelFormatter={(value) => formatLongDate(String(value), locale)}
                    formatter={(value) => (
                      <div className="flex min-w-32 items-center justify-between gap-4">
                        <span className="text-muted-foreground">
                          {t(`performance.${metric}`)}
                        </span>
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {metric === "revenue"
                            ? formatCurrency(Number(value))
                            : new Intl.NumberFormat(locale).format(Number(value))}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Area
                dataKey={metric}
                type="monotone"
                fill="url(#memberPerformanceFill)"
                stroke={`var(--color-${metric})`}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[280px] flex-col items-center justify-center px-6 text-center">
            <span className="grid size-10 place-items-center rounded-lg border border-border bg-muted/30 text-primary">
              <BarChart3 className="size-5" aria-hidden="true" />
            </span>
            <p className="mt-4 text-sm font-medium">{t("performance.empty")}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button asChild size="sm" className="h-10 rounded-lg">
                <Link href="/member/create">{t("actions.createLink")}</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="h-10 rounded-lg">
                <Link href="/member/links">{t("actions.myLinks")}</Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function DailyPerformanceTable({ data }: { data: MemberDashboardData }) {
  const t = useTranslations("MemberDashboard")
  const locale = useLocale()
  const { formatCurrency } = useMemberCurrency()

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="border-b border-border px-5 py-5 sm:px-6">
        <CardTitle className="text-base tracking-[-0.02em]">
          {t("daily.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/20 text-xs text-muted-foreground">
            <TableRow className="hover:bg-muted/20">
              <TableHead className="px-5 sm:px-6">{t("daily.date")}</TableHead>
              <TableHead className="px-4 text-right">{t("daily.views")}</TableHead>
              <TableHead className="px-4 text-right">{t("daily.earnings")}</TableHead>
              <TableHead className="px-5 text-right sm:px-6">{t("daily.averageCpm")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.analytics.series.map((item) => (
              <TableRow key={item.date} className="hover:bg-muted/20">
                <TableCell className="px-5 py-3.5 font-medium sm:px-6">
                  {formatLongDate(item.date, locale)}
                </TableCell>
                <TableCell className="px-4 py-3.5 text-right tabular-nums">
                  {new Intl.NumberFormat(locale).format(item.successfulOpens)}
                </TableCell>
                <TableCell className="px-4 py-3.5 text-right font-medium tabular-nums">
                  {formatCurrency(item.revenue)}
                </TableCell>
                <TableCell className="px-5 py-3.5 text-right tabular-nums sm:px-6">
                  {formatCurrency(item.averageCpm)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function TopLinks({ data }: { data: MemberDashboardData }) {
  const t = useTranslations("MemberDashboard")
  const locale = useLocale()
  const { formatCurrency } = useMemberCurrency()

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border px-5 py-5">
        <CardTitle className="text-base tracking-[-0.02em]">
          {t("topLinks.title")}
        </CardTitle>
        <Link href="/member/links" className="text-xs font-medium text-primary transition-colors hover:text-primary/80">
          {t("actions.viewAll")}
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {data.analytics.topLinks.length ? (
          <ul className="divide-y divide-border">
            {data.analytics.topLinks.map((link) => (
              <li key={link.id}>
                <Link
                  href={`/member/links/${link.id}/edit`}
                  className="group flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-md border border-border bg-muted/30 text-muted-foreground">
                    <Link2 className="size-3.5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{link.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">/{link.slug}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-medium tabular-nums">
                      {new Intl.NumberFormat(locale).format(link.successfulOpens)}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatCurrency(link.revenue)}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <CompactEmpty icon={Link2} label={t("topLinks.empty")} />
        )}
      </CardContent>
    </Card>
  )
}

function BreakdownCard({
  title,
  icon: Icon,
  items,
  renderLabel,
}: {
  title: string
  icon: LucideIcon
  items: MemberDashboardBreakdownItem[]
  renderLabel: (key: string) => ReactNode
}) {
  const t = useTranslations("MemberDashboard")
  const locale = useLocale()
  const maximum = Math.max(...items.map((item) => item.count), 1)

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="flex flex-row items-center gap-2 border-b border-border px-5 py-5">
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
        <CardTitle className="text-base tracking-[-0.02em]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        {items.length ? (
          <ul className="space-y-4">
            {items.slice(0, 5).map((item) => (
              <li key={item.key}>
                <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-muted-foreground">
                    {renderLabel(item.key)}
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {new Intl.NumberFormat(locale).format(item.count)}
                  </span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/70"
                    style={{ width: `${Math.max((item.count / maximum) * 100, 4)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <CompactEmpty icon={Icon} label={t("breakdowns.empty")} />
        )}
      </CardContent>
    </Card>
  )
}

function CompactEmpty({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center text-center">
      <span className="grid size-9 place-items-center rounded-lg border border-border bg-muted/30 text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <p className="mt-3 text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

function CountryLabel({ code, locale }: { code: string; locale: string }) {
  const names = useMemo(
    () => new Intl.DisplayNames([locale], { type: "region" }),
    [locale],
  )
  const label = code === "ZZ" ? "—" : names.of(code) || code

  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="inline-flex h-5 min-w-7 shrink-0 items-center justify-center rounded border border-border bg-muted/40 px-1 font-mono text-[9px] font-medium uppercase text-muted-foreground">
        {code === "ZZ" ? "—" : code}
      </span>
      <span className="truncate">{label}</span>
    </span>
  )
}

function DeviceIcon({ value }: { value: string }) {
  const Icon = value === "mobile" ? Smartphone : value === "tablet" ? Tablet : Monitor
  return <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
}

type Translator = ReturnType<typeof useTranslations<"MemberDashboard">>

function deviceLabel(value: string, t: Translator) {
  if (value === "mobile") return t("labels.mobile")
  if (value === "tablet") return t("labels.tablet")
  if (value === "desktop") return t("labels.desktop")
  return t("labels.other")
}

function browserLabel(value: string, t: Translator) {
  if (value === "chrome") return "Chrome"
  if (value === "safari") return "Safari"
  if (value === "firefox") return "Firefox"
  if (value === "edge") return "Edge"
  return t("labels.other")
}

function formatShortDate(value: string, locale: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  })
}

function formatLongDate(value: string, locale: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
}

function compactCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}
