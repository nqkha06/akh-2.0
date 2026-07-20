import Link from "next/link";
import { AlertCircle, CheckCircle2, CircleHelp, ExternalLink, LoaderCircle, Search, X } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

import type { SupportDashboardData } from "./types";
import type { SupportController } from "./use-support-controller";

export function SupportSearch({ controller }: { controller: SupportController }) {
  const hasQuery = Boolean(controller.query.trim());
  return <section aria-label="Tìm kiếm trợ giúp" className="relative"><label htmlFor="support-search" className="sr-only">Tìm nội dung hỗ trợ</label><Search className="pointer-events-none absolute left-4 top-3.5 size-5 text-muted-foreground" /><Input id="support-search" value={controller.query} onChange={(event) => controller.setQuery(event.target.value)} placeholder="Tìm hướng dẫn, câu hỏi hoặc tính năng..." className="h-12 rounded-lg bg-background pl-12 pr-20 text-sm shadow-none" />{hasQuery ? <Button type="button" size="icon-sm" variant="ghost" aria-label="Xóa nội dung tìm kiếm" className="absolute right-2 top-2.5" onClick={() => controller.setQuery("")}><X /></Button> : <kbd className="pointer-events-none absolute right-3 top-3 hidden rounded border border-border bg-muted px-2 py-1 font-sans text-[11px] text-muted-foreground sm:block">⌘ K</kbd>}{hasQuery ? <div className="absolute inset-x-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-lg border border-border bg-popover shadow-md"><div className="max-h-80 overflow-y-auto p-1">{controller.searchResults.length ? controller.searchResults.map((article) => <Link key={article.id} href={article.href} className="flex min-h-16 items-center gap-3 rounded-md px-3 py-2.5 outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"><div className="min-w-0 flex-1"><p className="text-sm font-medium">{article.title}</p><p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{article.summary}</p></div><span className="shrink-0 text-xs text-muted-foreground">{article.category}</span><ExternalLink className="size-4 shrink-0 text-muted-foreground" /></Link>) : <div className="px-4 py-8 text-center"><CircleHelp className="mx-auto size-6 text-muted-foreground" /><p className="mt-2 text-sm font-medium">Không tìm thấy hướng dẫn phù hợp</p><p className="mt-1 text-xs text-muted-foreground">Thử từ khóa khác hoặc gửi yêu cầu hỗ trợ.</p></div>}</div></div> : null}</section>;
}

export function SystemStatusStrip({ status }: { status: SupportDashboardData["systemStatus"] }) {
  const operational = status.state === "operational";
  const incident = status.state === "incident";
  const Icon = operational ? CheckCircle2 : incident ? AlertCircle : CircleHelp;
  return <div className="flex flex-col gap-2 border-y border-border px-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><Icon className={cn("size-4", operational && "text-primary", incident && "text-destructive", status.state === "unknown" && "text-muted-foreground")} /><span className="font-medium">{status.message}</span>{status.affectedService ? <span className="text-muted-foreground">· {status.affectedService}</span> : null}</div>{status.href ? <Button asChild variant="ghost" size="sm" className="w-fit"><Link href={status.href}>Xem trạng thái hệ thống<ExternalLink /></Link></Button> : <span className="text-xs text-muted-foreground">Trạng thái chưa được kết nối</span>}</div>;
}

export function SupportSkeleton() {
  return <div className="mx-auto w-full max-w-[1280px] space-y-6" aria-busy="true"><div><Skeleton className="h-8 w-32" /><Skeleton className="mt-2 h-4 w-96 max-w-full" /></div><Skeleton className="h-12 w-full rounded-lg" /><Skeleton className="h-12 w-full" /><div className="grid gap-5 lg:grid-cols-[minmax(0,1.75fr)_minmax(280px,1fr)]"><Skeleton className="h-[560px] rounded-lg" /><Skeleton className="h-72 rounded-lg" /></div><Skeleton className="h-64 rounded-lg" /></div>;
}

export function SupportErrorState({ onRetry }: { onRetry: () => void }) {
  return <div className="mx-auto w-full max-w-[1280px] space-y-6"><PageHeader title="Hỗ trợ" description="Tìm hướng dẫn hoặc gửi yêu cầu để nhận trợ giúp từ Rekonise." /><Alert variant="destructive"><AlertCircle /><AlertTitle>Không thể tải nội dung hỗ trợ.</AlertTitle><AlertDescription><p>Vui lòng thử lại.</p><Button variant="outline" size="sm" className="mt-3 bg-background" onClick={onRetry}><LoaderCircle />Thử lại</Button></AlertDescription></Alert></div>;
}
