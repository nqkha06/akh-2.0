"use client"

import Link from "next/link"
import {
  ArrowUpRight,
  Clock3,
  Globe2,
  Link2,
  MessagesSquare,
  Monitor,
  MousePointerClick,
  Network,
  ShieldAlert,
  Smartphone,
  Tablet,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

import type {
  AdminDashboardBreakdownItem,
  AdminDashboardData,
} from "../types"

const numberFormatter = new Intl.NumberFormat("vi-VN")
const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
})
const countryNames = new Intl.DisplayNames(["vi"], { type: "region" })

const chartConfig = {
  unlocks: {
    label: "Lượt vượt link",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  const metricItems = [
    {
      label: "Lượt vượt link",
      value: data.metrics.unlocks,
      hint: "Chỉ ghi nhận khi visitor mở destination",
      icon: MousePointerClick,
    },
    {
      label: "IP duy nhất",
      value: data.metrics.uniqueIps,
      hint: "Số địa chỉ IP khác nhau trong kỳ",
      icon: Network,
    },
    {
      label: "Social link hoạt động",
      value: data.metrics.activeLinks,
      hint: `${numberFormatter.format(data.metrics.linksTotal)} link trong hệ thống`,
      icon: Link2,
    },
    {
      label: "Thành viên",
      value: data.metrics.membersTotal,
      hint: `+${numberFormatter.format(data.metrics.newMembers)} tài khoản mới trong kỳ`,
      icon: Users,
    },
  ] as const

  return (
    <div className="space-y-6">
      <section
        className="grid overflow-hidden rounded-xl border border-border bg-card sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Chỉ số tổng quan"
      >
        {metricItems.map((item, index) => (
          <MetricCard
            key={item.label}
            {...item}
            className={cn(
              index > 0 && "border-t sm:border-t-0",
              index >= 2 && "sm:border-t",
              index === 1 && "sm:border-l",
              index === 3 && "sm:border-l",
              index > 0 && "xl:border-l xl:border-t-0",
            )}
          />
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.7fr)]">
        <UnlockTrend data={data} />
        <OperationsCard data={data} />
      </div>

      <section className="grid gap-6 lg:grid-cols-3" aria-label="Phân bố lượt vượt link">
        <BreakdownCard
          title="Quốc gia"
          description="Nguồn truy cập theo mã quốc gia."
          items={data.breakdowns.countries}
          renderLabel={(key) => (
            <span className="flex min-w-0 items-center gap-2">
              <CountryFlag code={key} />
              <span className="truncate">
                {key === "ZZ" ? "Không xác định" : countryNames.of(key) || key}
              </span>
            </span>
          )}
        />
        <BreakdownCard
          title="Thiết bị"
          description="Thiết bị dùng khi mở destination."
          items={data.breakdowns.devices}
          renderLabel={(key) => (
            <span className="flex items-center gap-2">
              <DeviceIcon value={key} />
              {deviceLabel(key)}
            </span>
          )}
        />
        <BreakdownCard
          title="Trình duyệt"
          description="Browser được nhận diện từ user agent."
          items={data.breakdowns.browsers}
          renderLabel={(key) => browserLabel(key)}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.6fr)]">
        <TopLinks data={data} />
        <RecentUnlocks data={data} />
      </div>
    </div>
  )
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Đang tải dữ liệu dashboard">
      <div className="grid overflow-hidden rounded-xl border border-border bg-card sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className={cn(
              "space-y-4 p-5",
              index > 0 && "border-t sm:border-t-0",
              index >= 2 && "sm:border-t",
              index === 1 && "sm:border-l",
              index === 3 && "sm:border-l",
              index > 0 && "xl:border-l xl:border-t-0",
            )}
          >
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="size-8 rounded-md" />
            </div>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-40 max-w-full" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.7fr)]">
        <Skeleton className="h-[370px] rounded-xl" />
        <Skeleton className="h-[370px] rounded-xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-72 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: {
  label: string
  value: number
  hint: string
  icon: LucideIcon
  className?: string
}) {
  return (
    <article className={cn("min-w-0 p-5", className)}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className="grid size-8 shrink-0 place-items-center rounded-md border border-border bg-muted/30 text-muted-foreground">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-[-0.04em] tabular-nums text-foreground">
        {numberFormatter.format(value)}
      </p>
      <p className="mt-1 truncate text-xs text-muted-foreground" title={hint}>
        {hint}
      </p>
    </article>
  )
}

function UnlockTrend({ data }: { data: AdminDashboardData }) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="border-b border-border py-5">
        <CardTitle className="text-base tracking-[-0.02em]">
          Lượt vượt link thành công
        </CardTitle>
        <CardDescription>
          Ghi nhận tại thời điểm visitor tiếp tục tới nội dung gốc.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-4 pt-5 sm:px-5">
        <ChartContainer
          config={chartConfig}
          className="h-[280px] w-full"
          initialDimension={{ width: 760, height: 280 }}
        >
          <AreaChart data={data.series} margin={{ left: 0, right: 12 }}>
            <defs>
              <linearGradient id="adminUnlockFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-unlocks)" stopOpacity={0.28} />
                <stop offset="95%" stopColor="var(--color-unlocks)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              minTickGap={30}
              tickMargin={10}
              tickFormatter={(value) =>
                new Date(`${value}T00:00:00Z`).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                })
              }
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={34}
            />
            <ChartTooltip
              cursor={{ stroke: "var(--border)" }}
              content={
                <ChartTooltipContent
                  indicator="line"
                  labelFormatter={(value) =>
                    new Date(`${String(value)}T00:00:00Z`).toLocaleDateString(
                      "vi-VN",
                      { dateStyle: "medium" },
                    )
                  }
                />
              }
            />
            <Area
              dataKey="unlocks"
              type="monotone"
              fill="url(#adminUnlockFill)"
              stroke="var(--color-unlocks)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function OperationsCard({ data }: { data: AdminDashboardData }) {
  const operations = [
    {
      label: "Yêu cầu rút tiền",
      value: data.operations.pendingWithdrawals,
      hint: "Đang chờ xử lý",
      href: "/admin/withdrawals",
      icon: WalletCards,
    },
    {
      label: "Ticket hỗ trợ",
      value: data.operations.openTickets,
      hint: "Đang mở hoặc chờ phản hồi",
      href: "/admin/support",
      icon: MessagesSquare,
    },
    {
      label: "Báo cáo liên kết",
      value: data.operations.pendingReports,
      hint: "Đang chờ hoặc đang kiểm tra",
      href: "/admin/link-reports",
      icon: ShieldAlert,
    },
  ] as const

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="border-b border-border py-5">
        <CardTitle className="text-base tracking-[-0.02em]">
          Cần xử lý
        </CardTitle>
        <CardDescription>Hàng đợi vận hành hiện tại.</CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border p-0">
        {operations.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              href={item.href}
              className="group flex min-h-24 items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-muted/30 text-muted-foreground">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">
                  {item.label}
                </span>
                <span className="mt-1 block truncate text-xs text-muted-foreground">
                  {item.hint}
                </span>
              </span>
              <span className="text-lg font-semibold tabular-nums">
                {numberFormatter.format(item.value)}
              </span>
              <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}

function BreakdownCard({
  title,
  description,
  items,
  renderLabel,
}: {
  title: string
  description: string
  items: AdminDashboardBreakdownItem[]
  renderLabel: (key: string) => React.ReactNode
}) {
  const maximum = Math.max(...items.map((item) => item.count), 1)

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="border-b border-border py-5">
        <CardTitle className="text-base tracking-[-0.02em]">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 py-5">
        {items.length ? (
          items.map((item) => (
            <div key={item.key}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 text-foreground">
                  {renderLabel(item.key)}
                </span>
                <span className="shrink-0 font-medium tabular-nums">
                  {numberFormatter.format(item.count)}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/75"
                  style={{ width: `${Math.max((item.count / maximum) * 100, 3)}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <EmptyData />
        )}
      </CardContent>
    </Card>
  )
}

function TopLinks({ data }: { data: AdminDashboardData }) {
  const maximum = Math.max(...data.topLinks.map((item) => item.unlocks), 1)

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="border-b border-border py-5">
        <CardTitle className="text-base tracking-[-0.02em]">
          Link nổi bật
        </CardTitle>
        <CardDescription>Xếp theo lượt vượt thành công trong kỳ.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {data.topLinks.length ? (
          <ol className="divide-y divide-border">
            {data.topLinks.map((item, index) => (
              <li key={item.id} className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-muted text-xs font-medium text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/social-links?title=${encodeURIComponent(item.slug)}`}
                      className="block truncate text-sm font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {item.user.name} · /{item.slug}
                    </p>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary/70"
                        style={{ width: `${Math.max((item.unlocks / maximum) * 100, 4)}%` }}
                      />
                    </div>
                  </div>
                  <span className="font-medium tabular-nums">
                    {numberFormatter.format(item.unlocks)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="p-5">
            <EmptyData />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function RecentUnlocks({ data }: { data: AdminDashboardData }) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="border-b border-border py-5">
        <CardTitle className="text-base tracking-[-0.02em]">
          Lượt vượt gần đây
        </CardTitle>
        <CardDescription>
          Quốc gia, thiết bị, trình duyệt và IP tại thời điểm mở destination.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {data.recentUnlocks.length ? (
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-11 pl-5 text-xs text-muted-foreground">
                  Social link
                </TableHead>
                <TableHead className="h-11 text-xs text-muted-foreground">
                  Quốc gia
                </TableHead>
                <TableHead className="h-11 text-xs text-muted-foreground">
                  Thiết bị
                </TableHead>
                <TableHead className="h-11 text-xs text-muted-foreground">
                  Browser
                </TableHead>
                <TableHead className="h-11 text-xs text-muted-foreground">
                  IP
                </TableHead>
                <TableHead className="h-11 pr-5 text-right text-xs text-muted-foreground">
                  Thời gian
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentUnlocks.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="max-w-56 py-3 pl-5">
                    <Link
                      href={`/admin/social-links?title=${encodeURIComponent(item.link.slug)}`}
                      className="block truncate font-medium underline-offset-4 hover:underline"
                    >
                      {item.link.title}
                    </Link>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {item.link.user.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <CountryFlag code={item.countryCode} />
                      {item.countryCode}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <DeviceIcon value={item.deviceType} />
                      {deviceLabel(item.deviceType)}
                    </span>
                  </TableCell>
                  <TableCell>{browserLabel(item.browserFamily)}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {item.ipAddress || "—"}
                  </TableCell>
                  <TableCell className="pr-5 text-right text-xs text-muted-foreground">
                    {dateFormatter.format(new Date(item.createdAt))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-6">
            <EmptyData />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CountryFlag({ code }: { code: string }) {
  if (!/^[A-Z]{2}$/.test(code) || code === "ZZ") {
    return (
      <span className="grid size-5 shrink-0 place-items-center rounded-sm border border-border bg-muted text-muted-foreground">
        <Globe2 className="size-3" />
      </span>
    )
  }

  return (
    <span
      className={`fi fi-${code.toLowerCase()} shrink-0 rounded-[2px] shadow-sm ring-1 ring-black/10`}
      aria-label={countryNames.of(code) || code}
    />
  )
}

function DeviceIcon({ value }: { value: string }) {
  const Icon = value === "mobile" ? Smartphone : value === "tablet" ? Tablet : Monitor
  return <Icon className="size-4 shrink-0 text-muted-foreground" />
}

function deviceLabel(value: string) {
  if (value === "mobile") return "Di động"
  if (value === "tablet") return "Máy tính bảng"
  return "Máy tính"
}

function browserLabel(value: string) {
  const labels: Record<string, string> = {
    chrome: "Chrome",
    safari: "Safari",
    firefox: "Firefox",
    edge: "Microsoft Edge",
    other: "Khác",
  }
  return labels[value] || value
}

function EmptyData() {
  return (
    <div className="flex min-h-24 flex-col items-center justify-center text-center">
      <Clock3 className="size-5 text-muted-foreground" />
      <p className="mt-2 text-sm font-medium">Chưa có dữ liệu trong kỳ</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Dữ liệu xuất hiện sau khi visitor vượt link thành công.
      </p>
    </div>
  )
}
