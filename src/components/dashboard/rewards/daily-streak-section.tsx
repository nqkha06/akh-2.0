import Link from "next/link";
import { CalendarDays, Check, CheckCircle2, Circle, Clock3, Minus, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { RecentStreakDay, RewardMilestone, RewardsDashboardData } from "./types";
import { formatRewardAmount } from "./use-rewards-controller";

const calendarStatus = {
  completed: { label: "Hoàn thành", icon: Check, className: "border-primary/30 bg-primary/10 text-primary" },
  today: { label: "Hôm nay", icon: CheckCircle2, className: "border-primary bg-background text-primary ring-2 ring-primary/15" },
  missed: { label: "Bỏ lỡ", icon: Minus, className: "border-destructive/30 bg-destructive/5 text-destructive" },
  upcoming: { label: "Chưa tới", icon: Circle, className: "border-border bg-muted/30 text-muted-foreground" },
} as const;

export function StreakCalendar({ days }: { days: RecentStreakDay[] }) {
  return (
    <div className="overflow-x-auto pb-1" aria-label="Hoạt động 7 ngày gần nhất">
      <div className="grid min-w-[560px] grid-cols-7 border-y border-border">
        {days.map((day, index) => {
          const config = calendarStatus[day.status];
          const Icon = config.icon;
          return <div key={day.date} className={cn("flex min-h-24 flex-col items-center justify-center gap-1.5 px-2 py-3 text-center", index > 0 && "border-l border-border")}><span className="text-xs font-medium text-muted-foreground">{day.dayLabel}</span><span className="text-sm font-medium tabular-nums">{day.dateLabel}</span><span className={cn("inline-flex size-7 items-center justify-center rounded-full border", config.className)} title={config.label}><Icon className="size-3.5" /><span className="sr-only">{config.label}</span></span><span className="text-[11px] text-muted-foreground">{config.label}</span></div>;
        })}
      </div>
    </div>
  );
}

export function StreakMilestones({ milestones, currentDays }: { milestones: RewardMilestone[]; currentDays: number }) {
  return (
    <ol className="relative space-y-0" aria-label="Các cột mốc chuỗi hoạt động">
      {milestones.map((milestone, index) => {
        const completed = milestone.status === "claimed";
        const current = milestone.status === "current";
        const remaining = Math.max(0, milestone.target - currentDays);
        return <li key={milestone.id} className="relative flex gap-3 pb-5 last:pb-0"><div className="relative flex w-5 shrink-0 justify-center">{index < milestones.length - 1 ? <span className={cn("absolute top-5 bottom-0 w-px", completed ? "bg-primary/50" : "bg-border")} /> : null}<span className={cn("relative z-10 mt-0.5 grid size-5 place-items-center rounded-full border bg-background", completed && "border-primary bg-primary text-primary-foreground", current && "border-primary text-primary ring-4 ring-primary/10")} aria-hidden="true">{completed ? <Check className="size-3" /> : current ? <span className="size-1.5 rounded-full bg-primary" /> : <span className="size-1.5 rounded-full bg-muted-foreground/50" />}</span></div><div className={cn("flex min-w-0 flex-1 items-start justify-between gap-3 rounded-md px-2 py-1", current && "bg-primary/5")}><div><p className="text-sm font-medium tabular-nums">{milestone.target} ngày</p><p className="mt-0.5 text-xs text-muted-foreground">{completed ? "Đã cộng vào ví" : current ? `Còn ${remaining} ngày` : "Chưa đạt"}</p></div><div className="text-right">{milestone.reward ? <p className="text-sm font-medium tabular-nums">{formatRewardAmount(milestone.reward.amount)}</p> : <p className="text-xs text-muted-foreground">Huy hiệu</p>}{completed ? <Badge variant="secondary" className="mt-1"><CheckCircle2 />Đã nhận</Badge> : null}</div></div></li>;
      })}
    </ol>
  );
}

export function DailyStreakSection({ data }: { data: RewardsDashboardData }) {
  const streak = data.streak;
  return (
    <section className="rounded-lg border border-border bg-card" aria-labelledby="daily-streak-title">
      <div className="border-b border-border px-5 py-4 sm:px-6"><div className="flex items-start gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"><CalendarDays className="size-4" /></div><div><h2 id="daily-streak-title" className="text-base font-semibold">Chuỗi hoạt động hằng ngày</h2><p className="mt-1 text-sm text-muted-foreground">Hoạt động mỗi ngày để duy trì chuỗi và tăng tỷ lệ thưởng.</p></div></div></div>
      <div className="grid lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.85fr)]">
        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-medium text-muted-foreground">Chuỗi hiện tại</p><p className="mt-1 text-3xl font-semibold tracking-[-0.04em] tabular-nums">{streak.currentDays} ngày liên tiếp</p><p className="mt-2 text-sm font-medium text-primary">{streak.currentBonus} thưởng thêm</p></div><div className="text-left sm:text-right"><p className="text-xs text-muted-foreground">Chuỗi dài nhất</p><p className="mt-1 text-lg font-semibold tabular-nums">{streak.longestStreak} ngày</p></div></div>
          <div className="flex flex-col gap-3 rounded-md border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="flex items-center gap-2 text-sm font-medium">{streak.completedToday ? <CheckCircle2 className="size-4 text-primary" /> : <Clock3 className="size-4 text-muted-foreground" />}{streak.completedToday ? "Hôm nay đã hoàn thành" : "Hôm nay chưa hoàn thành"}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Hoàn thành ít nhất một hoạt động hợp lệ trước {streak.resetAtLabel ?? "khi ngày kết thúc"} để duy trì chuỗi.</p></div>{!streak.completedToday ? <Button className="w-full shrink-0 sm:w-auto" asChild><Link href="/member/links">Hoàn thành hoạt động hôm nay</Link></Button> : null}</div>
          <StreakCalendar days={streak.recentDays} />
          <div className="grid gap-3 text-sm sm:grid-cols-3"><div><p className="text-xs text-muted-foreground">Mỗi ngày liên tiếp</p><p className="mt-1 font-medium">{streak.incrementPerDay ?? "Theo cấu hình hệ thống"}</p></div><div><p className="text-xs text-muted-foreground">Giới hạn tối đa</p><p className="mt-1 font-medium">{streak.maxBonus ?? "Theo cấu hình hệ thống"}</p></div><div><p className="flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldAlert className="size-3.5" />Khi mất chuỗi</p><p className="mt-1 font-medium">Đặt lại về 0</p></div></div>
        </div>
        <div className="border-t border-border p-5 sm:p-6 lg:border-l lg:border-t-0"><div className="mb-5"><h3 className="text-sm font-semibold">Cột mốc chuỗi</h3><p className="mt-1 text-xs text-muted-foreground">Phần thưởng được tự động cộng sau khi xác minh.</p></div><StreakMilestones milestones={streak.milestones} currentDays={streak.currentDays} /></div>
      </div>
    </section>
  );
}
