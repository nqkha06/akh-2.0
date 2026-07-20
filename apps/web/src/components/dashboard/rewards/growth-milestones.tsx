import { Check, Circle, Eye, LockOpen, MousePointerClick, ShieldCheck } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import type { GrowthMilestoneGroup, GrowthMetric, RewardMilestone, RewardsDashboardData } from "./types";
import { formatRewardAmount } from "./use-rewards-controller";

const metricIcons: Record<GrowthMetric, typeof Eye> = { views: Eye, unlocks: LockOpen, clicks: MousePointerClick };

export function MilestoneProgress({ group }: { group: GrowthMilestoneGroup }) {
  const progress = Math.min(100, (group.currentValue / group.nextTarget) * 100);
  const remaining = Math.max(0, group.nextTarget - group.currentValue);
  const nextMilestone = group.milestones.find((item) => item.status === "current");
  return (
    <div className="space-y-3"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs text-muted-foreground">Tiến độ hiện tại</p><p className="mt-1 text-2xl font-semibold tracking-[-0.03em] tabular-nums">{new Intl.NumberFormat("vi-VN").format(group.currentValue)} <span className="text-base font-normal text-muted-foreground">/ {new Intl.NumberFormat("vi-VN").format(group.nextTarget)} {group.unit}</span></p></div>{nextMilestone?.reward ? <p className="text-sm text-muted-foreground">Còn <span className="font-medium tabular-nums text-foreground">{new Intl.NumberFormat("vi-VN").format(remaining)}</span> để nhận <span className="font-medium text-primary">{formatRewardAmount(nextMilestone.reward.amount)}</span></p> : null}</div><Progress value={progress} aria-label={`Đã hoàn thành ${Math.round(progress)}%`} /><p className="text-right text-xs font-medium tabular-nums text-muted-foreground">{Math.round(progress)}%</p></div>
  );
}

function GrowthMilestoneRail({ milestones, currentValue, unit }: { milestones: RewardMilestone[]; currentValue: number; unit: string }) {
  return <ol className="mt-6 divide-y divide-border border-y border-border">{milestones.map((milestone) => { const completed = milestone.status === "claimed"; const current = milestone.status === "current"; return <li key={milestone.id} className={cn("grid min-h-14 grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 px-2 py-2.5", current && "bg-primary/5")}><span className={cn("grid size-5 place-items-center rounded-full border", completed && "border-primary bg-primary text-primary-foreground", current && "border-primary text-primary")} aria-hidden="true">{completed ? <Check className="size-3" /> : current ? <span className="size-1.5 rounded-full bg-primary" /> : <Circle className="size-2.5 text-muted-foreground" />}</span><div><p className="text-sm font-medium tabular-nums">{new Intl.NumberFormat("vi-VN").format(milestone.target)} {unit}</p><p className="text-xs text-muted-foreground">{completed ? "Đã nhận" : current ? `${new Intl.NumberFormat("vi-VN").format(currentValue)} / ${new Intl.NumberFormat("vi-VN").format(milestone.target)}` : "Chưa đạt"}</p></div><span className="text-sm font-medium tabular-nums">{milestone.reward ? formatRewardAmount(milestone.reward.amount) : "—"}</span></li>; })}</ol>;
}

export function MilestoneTabs({ groups }: { groups: GrowthMilestoneGroup[] }) {
  if (!groups.length) return null;
  return <Tabs defaultValue={groups[0].type} className="gap-5"><div className="overflow-x-auto"><TabsList variant="line" className="min-w-max border-b border-border px-0">{groups.map((group) => { const Icon = metricIcons[group.type]; return <TabsTrigger key={group.type} value={group.type} className="min-h-10 px-3"><Icon />{group.label}</TabsTrigger>; })}</TabsList></div>{groups.map((group) => <TabsContent key={group.type} value={group.type}><MilestoneProgress group={group} /><GrowthMilestoneRail milestones={group.milestones} currentValue={group.currentValue} unit={group.unit} /></TabsContent>)}</Tabs>;
}

export function GrowthMilestones({ data }: { data: RewardsDashboardData }) {
  return <section className="rounded-lg border border-border bg-card" aria-labelledby="growth-milestones-title"><div className="flex items-start gap-3 border-b border-border px-5 py-4 sm:px-6"><div className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"><ShieldCheck className="size-4" /></div><div><h2 id="growth-milestones-title" className="text-base font-semibold">Cột mốc tăng trưởng</h2><p className="mt-1 text-sm text-muted-foreground">Nhận thưởng khi nội dung của bạn đạt các mốc hiệu suất.</p></div></div><div className="p-5 sm:p-6"><MilestoneTabs groups={data.growthMilestones} /><p className="mt-5 text-xs leading-5 text-muted-foreground">Chỉ hoạt động hợp lệ mới được tính. Traffic bất thường, bot hoặc thao tác trùng lặp có thể bị loại khỏi kết quả.</p></div></section>;
}
