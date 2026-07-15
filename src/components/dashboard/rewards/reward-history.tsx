import { Ban, CheckCircle2, ChevronRight, CircleAlert, Clock3, MoreHorizontal, SearchX, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

import type { RewardHistoryItem, RewardStatus } from "./types";
import type { RewardsController } from "./use-rewards-controller";
import { formatRewardAmount, formatRewardDate } from "./use-rewards-controller";

const historyStatus: Record<RewardStatus, { label: string; icon: typeof Clock3; className: string }> = {
  credited: { label: "Đã cộng vào ví", icon: CheckCircle2, className: "bg-primary/10 text-primary" },
  verifying: { label: "Đang xác minh", icon: ShieldAlert, className: "bg-muted text-foreground" },
  invalid: { label: "Không hợp lệ", icon: CircleAlert, className: "bg-destructive/10 text-destructive" },
  expired: { label: "Đã hết hạn", icon: Clock3, className: "bg-muted text-muted-foreground" },
  cancelled: { label: "Đã hủy", icon: Ban, className: "bg-muted text-muted-foreground" },
};

function RewardStatusBadge({ status }: { status: RewardStatus }) {
  const config = historyStatus[status];
  const Icon = config.icon;
  return <Badge variant="secondary" className={cn("whitespace-nowrap font-medium", config.className)}><Icon />{config.label}</Badge>;
}

export function RewardHistory({ items, onOpen }: { items: RewardHistoryItem[]; onOpen: (item: RewardHistoryItem) => void }) {
  return <section aria-labelledby="reward-history-title"><div><h2 id="reward-history-title" className="text-lg font-semibold tracking-[-0.015em]">Lịch sử phần thưởng</h2><p className="mt-1 text-sm text-muted-foreground">Các phần thưởng đã nhận, đang xác minh hoặc không hợp lệ.</p></div>{!items.length ? <div className="mt-4 border-y border-border px-4 py-10 text-center"><SearchX className="mx-auto size-7 text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">Các phần thưởng bạn nhận được sẽ xuất hiện tại đây.</p></div> : <div className="mt-4 border-y border-border"><div className="hidden overflow-x-auto md:block"><Table className="min-w-[820px]"><TableHeader><TableRow className="bg-muted/20"><TableHead>Phần thưởng</TableHead><TableHead>Nguồn</TableHead><TableHead>Ngày</TableHead><TableHead className="text-right">Số tiền</TableHead><TableHead>Trạng thái</TableHead><TableHead className="w-12"><span className="sr-only">Thao tác</span></TableHead></TableRow></TableHeader><TableBody>{items.map((item) => <TableRow key={item.id} className="h-16"><TableCell><button type="button" className="text-left" onClick={() => onOpen(item)}><span className="text-sm font-medium">{item.title}</span><span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">{item.id}</span></button></TableCell><TableCell className="text-sm text-muted-foreground">{item.source}</TableCell><TableCell className="text-sm text-muted-foreground">{formatRewardDate(item.earnedAt)}</TableCell><TableCell className="text-right font-semibold tabular-nums">+{formatRewardAmount(item.amount.amount)}</TableCell><TableCell><RewardStatusBadge status={item.status} /></TableCell><TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`Thao tác cho ${item.id}`}><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => onOpen(item)}><ChevronRight />Xem chi tiết</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>)}</TableBody></Table></div><div className="divide-y divide-border md:hidden">{items.map((item) => <button key={item.id} type="button" className="flex min-h-24 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30" onClick={() => onOpen(item)}><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><span className="truncate text-sm font-medium">{item.title}</span><span className="shrink-0 font-semibold tabular-nums">+{formatRewardAmount(item.amount.amount)}</span></div><div className="mt-2 flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-muted-foreground">{formatRewardDate(item.earnedAt)}</span><RewardStatusBadge status={item.status} /></div></div><ChevronRight className="size-4 shrink-0 text-muted-foreground" /></button>)}</div></div>}</section>;
}

export function RewardDetailSheet({ controller }: { controller: RewardsController }) {
  const item = controller.detailItem;
  if (!item) return null;
  return <Sheet open onOpenChange={(open) => { if (!open) controller.setDetailItem(undefined); }}><SheetContent className="w-full overflow-y-auto sm:max-w-md"><SheetHeader className="border-b border-border px-5 py-5"><SheetTitle>Chi tiết phần thưởng</SheetTitle><SheetDescription>{item.id}</SheetDescription></SheetHeader><div className="space-y-6 px-5 py-2"><section><p className="text-xs font-medium text-muted-foreground">Trạng thái</p><div className="mt-2"><RewardStatusBadge status={item.status} /></div></section>{item.rejectionReason ? <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4"><p className="text-sm font-medium text-destructive">Lý do không hợp lệ</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{item.rejectionReason}</p></div> : null}<Separator /><dl className="space-y-4 text-sm"><div><dt className="text-xs text-muted-foreground">Phần thưởng</dt><dd className="mt-1 font-medium">{item.title}</dd></div><div><dt className="text-xs text-muted-foreground">Điều kiện</dt><dd className="mt-1 leading-6">{item.condition}</dd></div><div><dt className="text-xs text-muted-foreground">Nguồn</dt><dd className="mt-1 font-medium">{item.source}</dd></div><div><dt className="text-xs text-muted-foreground">Số tiền</dt><dd className="mt-1 text-lg font-semibold tabular-nums text-primary">+{formatRewardAmount(item.amount.amount)}</dd></div><div><dt className="text-xs text-muted-foreground">Ngày đạt</dt><dd className="mt-1 font-medium">{formatRewardDate(item.earnedAt)}</dd></div>{item.creditedAt ? <div><dt className="text-xs text-muted-foreground">Ngày được cộng</dt><dd className="mt-1 font-medium">{formatRewardDate(item.creditedAt)}</dd></div> : null}</dl></div></SheetContent></Sheet>;
}
