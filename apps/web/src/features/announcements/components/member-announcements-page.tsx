"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCheck, ChevronDown, ExternalLink, LoaderCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { listMemberAnnouncements } from "../api/announcements.client";
import type { MemberAnnouncement } from "../types";
import { announcementDisplayLabels } from "../types";
import { AnnouncementContent, AnnouncementIcon, announcementPlainText, announcementTone } from "./announcement-ui";
import { useAnnouncements } from "./announcements-provider";

export function MemberAnnouncementsPage() {
  const { markRead, markAllRead, trackClick } = useAnnouncements();
  const [items, setItems] = React.useState<MemberAnnouncement[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<"all" | "unread" | "read">("all");
  const [expanded, setExpanded] = React.useState<number | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await listMemberAnnouncements({ displayType: "notification", perPage: 50 });
      setItems(result.items);
      const focusId = Number(new URLSearchParams(window.location.search).get("focus"));
      if (Number.isInteger(focusId) && result.items.some((item) => item.id === focusId)) {
        setExpanded(focusId);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải thông báo.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const initialLoad = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [load]);

  const visible = items.filter((item) => filter === "all" || (filter === "unread" ? !item.state.readAt : Boolean(item.state.readAt)));

  async function toggle(item: MemberAnnouncement) {
    const next = expanded === item.id ? null : item.id;
    setExpanded(next);
    if (next && !item.state.readAt) {
      try {
        await markRead(item.id);
        setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, state: { ...entry.state, readAt: new Date().toISOString() } } : entry));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không thể đánh dấu đã đọc.");
      }
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Trung tâm thông báo</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Thông báo hệ thống</h1><p className="mt-1 text-sm text-muted-foreground">Cập nhật vận hành, tính năng và những việc cần bạn chú ý.</p></div>
        <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} />Làm mới</Button><Button variant="outline" size="sm" onClick={() => void markAllRead().then(load).catch((error) => toast.error(error instanceof Error ? error.message : "Không thể cập nhật thông báo."))}><CheckCheck />Đánh dấu tất cả đã đọc</Button></div>
      </div>
      <Tabs value={filter} onValueChange={(value) => setFilter(value as typeof filter)}><TabsList><TabsTrigger value="all">Tất cả</TabsTrigger><TabsTrigger value="unread">Chưa đọc</TabsTrigger><TabsTrigger value="read">Đã đọc</TabsTrigger></TabsList></Tabs>
      {loading ? <Card className="flex min-h-52 items-center justify-center"><LoaderCircle className="size-5 animate-spin text-muted-foreground" /></Card> : visible.length ? <div className="space-y-3">{visible.map((item) => {
        const open = expanded === item.id;
        const unread = !item.state.readAt;
        return <Card key={item.id} className={cn("gap-0 overflow-hidden py-0", unread && "border-primary/30")}>
          <button type="button" onClick={() => void toggle(item)} className="flex w-full items-start gap-3 px-4 py-4 text-left sm:px-5">
            <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl border", announcementTone(item.type))}><AnnouncementIcon type={item.type} className="size-5" /></span>
            <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold">{item.title}</span>{unread ? <span className="size-2 rounded-full bg-primary" aria-label="Chưa đọc" /> : null}<Badge variant="outline" className="h-5 text-[10px]">{announcementDisplayLabels[item.displayType]}</Badge></span><span className="mt-1 line-clamp-2 block text-xs leading-5 text-muted-foreground">{announcementPlainText(item.summary || item.content)}</span><span className="mt-2 block text-[11px] text-muted-foreground">{new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.publishedAt || item.createdAt))}</span></span>
            <ChevronDown className={cn("mt-2 size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
          </button>
          {open ? <div className="border-t border-border bg-muted/10 px-4 py-4 sm:px-5"><AnnouncementContent content={item.content} />{item.actionLabel && item.actionUrl ? <Button asChild size="sm" className="mt-4"><Link href={item.actionUrl} target={item.actionUrl.startsWith("/") ? undefined : "_blank"} rel="noopener noreferrer" onClick={() => void trackClick(item.id).catch((error) => toast.error(error instanceof Error ? error.message : "Không thể ghi nhận thao tác."))}>{item.actionLabel}<ExternalLink /></Link></Button> : null}</div> : null}
        </Card>;
      })}</div> : <Card className="flex min-h-52 flex-col items-center justify-center text-center"><AnnouncementIcon type="info" className="size-7 text-muted-foreground" /><p className="mt-3 text-sm font-medium">Không có thông báo phù hợp</p><p className="mt-1 text-xs text-muted-foreground">Thông báo mới sẽ xuất hiện tại đây.</p></Card>}
    </div>
  );
}
