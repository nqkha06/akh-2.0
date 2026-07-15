import Link from "next/link";
import { CheckCircle2, CircleDashed, Clock3, ExternalLink, Eye, FileText, Link2, LoaderCircle, LockOpen, UserRound } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import type { MissionStatus, RewardMission } from "./types";
import type { RewardsController } from "./use-rewards-controller";
import { formatRewardAmount } from "./use-rewards-controller";

const missionIcons = { link: Link2, bio: FileText, views: Eye, unlock: LockOpen, profile: UserRound };
const missionStatus: Record<MissionStatus, { label: string; icon: typeof Clock3; className: string }> = {
  not_started: { label: "Chưa bắt đầu", icon: CircleDashed, className: "bg-muted text-muted-foreground" },
  in_progress: { label: "Đang thực hiện", icon: Clock3, className: "bg-muted text-foreground" },
  completed: { label: "Hoàn thành", icon: CheckCircle2, className: "bg-primary/10 text-primary" },
  claimed: { label: "Đã nhận", icon: CheckCircle2, className: "bg-primary/10 text-primary" },
  expired: { label: "Đã hết hạn", icon: Clock3, className: "bg-destructive/10 text-destructive" },
};

export function RewardClaimButton({ mission, controller }: { mission: RewardMission; controller: RewardsController }) {
  const busy = controller.claimingId === mission.id;
  if (mission.status === "completed") return <Button size="sm" className="h-10 w-full sm:w-auto" disabled={Boolean(controller.claimingId)} onClick={() => void controller.claimMission(mission.id)}>{busy ? <><LoaderCircle className="animate-spin" />Đang nhận…</> : "Nhận thưởng"}</Button>;
  if (mission.actionHref && mission.actionLabel && !["claimed", "expired"].includes(mission.status)) return <Button variant="outline" size="sm" className="h-10 w-full sm:w-auto" asChild><Link href={mission.actionHref}>{mission.actionLabel}<ExternalLink /></Link></Button>;
  return null;
}

export function MissionRow({ mission, controller }: { mission: RewardMission; controller: RewardsController }) {
  const Icon = missionIcons[mission.icon];
  const config = missionStatus[mission.status];
  const StatusIcon = config.icon;
  const progress = Math.min(100, (mission.progress / mission.target) * 100);
  return <div data-mission-id={mission.id} className="grid gap-4 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_170px_110px] sm:items-center sm:px-5"><div className="flex min-w-0 gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-muted/30 text-muted-foreground"><Icon className="size-4" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-medium">{mission.title}</h3><Badge variant="secondary" className={cn("font-medium", config.className)}><StatusIcon />{config.label}</Badge></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{mission.description}</p>{mission.expiresLabel ? <p className="mt-1 text-xs text-muted-foreground">{mission.expiresLabel}</p> : null}</div></div><div><div className="mb-2 flex items-center justify-between text-xs"><span className="text-muted-foreground">Tiến độ</span><span className="font-medium tabular-nums">{mission.progress} / {mission.target}</span></div><Progress value={progress} aria-label={`${mission.title}: ${Math.round(progress)}%`} /></div><div className="flex flex-col items-stretch gap-2 text-right sm:items-end"><span className="text-sm font-semibold tabular-nums text-primary">+{formatRewardAmount(mission.reward.amount)}</span><RewardClaimButton mission={mission} controller={controller} /></div></div>;
}

export function WeeklyMissions({ data, controller }: { data: { missions: RewardMission[] }; controller: RewardsController }) {
  return <section className="rounded-lg border border-border bg-card" aria-labelledby="weekly-missions-title"><div className="border-b border-border px-5 py-4 sm:px-6"><h2 id="weekly-missions-title" className="text-base font-semibold">Nhiệm vụ tăng trưởng</h2><p className="mt-1 text-sm text-muted-foreground">Hoàn thành các nhiệm vụ trong tuần để nhận thêm phần thưởng.</p></div>{controller.claimError ? <Alert variant="destructive" className="m-4"><AlertDescription>{controller.claimError}</AlertDescription></Alert> : null}<div className="divide-y divide-border">{data.missions.map((mission) => <MissionRow key={mission.id} mission={mission} controller={controller} />)}</div></section>;
}
