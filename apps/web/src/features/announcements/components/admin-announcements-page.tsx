"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Copy, LoaderCircle, Pause, Pencil, Plus, RefreshCw, Search, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import {
  deleteAdminAnnouncement,
  duplicateAdminAnnouncement,
  listAdminAnnouncements,
  pauseAdminAnnouncement,
  publishAdminAnnouncement,
} from "../api/announcements.client";
import type { AdminAnnouncement, AnnouncementDisplay, AnnouncementPriority, AnnouncementStatus, AnnouncementTargetType } from "../types";
import { announcementDisplayLabels, announcementStatusLabels, announcementTypeLabels } from "../types";

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";
}

export function AdminAnnouncementsPage() {
  const permissions = useAdminPermissions();
  const canCreate = permissions.includes("announcements.create");
  const canUpdate = permissions.includes("announcements.update");
  const canDelete = permissions.includes("announcements.delete");
  const canPublish = permissions.includes("announcements.publish");
  const [items, setItems] = React.useState<AdminAnnouncement[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<AnnouncementStatus | "all">("all");
  const [displayType, setDisplayType] = React.useState<AnnouncementDisplay | "all">("all");
  const [priority, setPriority] = React.useState<AnnouncementPriority | "all">("all");
  const [targetType, setTargetType] = React.useState<AnnouncementTargetType | "all">("all");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pagination, setPagination] = React.useState({ page: 1, perPage: 20, total: 0, totalPages: 1 });
  const [deleting, setDeleting] = React.useState<AdminAnnouncement | null>(null);
  const [mutating, setMutating] = React.useState<number | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await listAdminAnnouncements({
        search,
        status,
        displayType,
        priority,
        targetType,
        dateFrom: dateFrom ? new Date(`${dateFrom}T00:00:00`).toISOString() : undefined,
        dateTo: dateTo ? new Date(`${dateTo}T23:59:59.999`).toISOString() : undefined,
        page,
      });
      setItems(result.items);
      setPagination(result.pagination);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải thông báo.");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, displayType, page, priority, search, status, targetType]);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 200);
    return () => window.clearTimeout(timeout);
  }, [load]);

  async function mutate(item: AdminAnnouncement, action: "publish" | "pause" | "duplicate") {
    setMutating(item.id);
    try {
      if (action === "publish") await publishAdminAnnouncement(item.id);
      else if (action === "pause") await pauseAdminAnnouncement(item.id);
      else await duplicateAdminAnnouncement(item.id);
      toast.success(action === "publish" ? "Đã phát hành thông báo." : action === "pause" ? "Đã tạm dừng thông báo." : "Đã nhân bản thông báo.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể thực hiện thao tác.");
    } finally {
      setMutating(null);
    }
  }

  return <div className="mx-auto w-full max-w-[1400px] space-y-6 pb-8">
    <AdminPageHeader title="Thông báo hệ thống" description="Quản lý notification center, banner, modal và lịch phát hành cho member." actions={canCreate ? <Button asChild><Link href="/admin/announcements/create"><Plus />Tạo thông báo</Link></Button> : null} />
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
        <div className="relative min-w-56 flex-1 lg:max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Tìm tiêu đề hoặc slug..." className="pl-9" /></div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap">
          <Select value={status} onValueChange={(value) => { setStatus(value as typeof status); setPage(1); }}><SelectTrigger className="lg:w-40"><SelectValue placeholder="Trạng thái" /></SelectTrigger><SelectContent><SelectItem value="all">Mọi trạng thái</SelectItem>{Object.entries(announcementStatusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
          <Select value={displayType} onValueChange={(value) => { setDisplayType(value as typeof displayType); setPage(1); }}><SelectTrigger className="lg:w-48"><SelectValue placeholder="Hiển thị" /></SelectTrigger><SelectContent><SelectItem value="all">Mọi hiển thị</SelectItem>{Object.entries(announcementDisplayLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
          <Select value={priority} onValueChange={(value) => { setPriority(value as typeof priority); setPage(1); }}><SelectTrigger className="lg:w-40"><SelectValue placeholder="Ưu tiên" /></SelectTrigger><SelectContent><SelectItem value="all">Mọi ưu tiên</SelectItem><SelectItem value="low">Thấp</SelectItem><SelectItem value="normal">Bình thường</SelectItem><SelectItem value="high">Cao</SelectItem><SelectItem value="critical">Khẩn cấp</SelectItem></SelectContent></Select>
          <Select value={targetType} onValueChange={(value) => { setTargetType(value as typeof targetType); setPage(1); }}><SelectTrigger className="lg:w-40"><SelectValue placeholder="Đối tượng" /></SelectTrigger><SelectContent><SelectItem value="all">Mọi đối tượng</SelectItem><SelectItem value="users">Theo user</SelectItem><SelectItem value="roles">Theo role</SelectItem></SelectContent></Select>
          <Input type="date" aria-label="Tạo từ ngày" value={dateFrom} max={dateTo || undefined} onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} className="lg:w-40" />
          <Input type="date" aria-label="Tạo đến ngày" value={dateTo} min={dateFrom || undefined} onChange={(event) => { setDateTo(event.target.value); setPage(1); }} className="lg:w-40" />
        </div>
        <Button variant="outline" size="icon" onClick={() => void load()} aria-label="Làm mới"><RefreshCw className={loading ? "animate-spin" : ""} /></Button>
      </div>
      <div className="overflow-x-auto">
        <Table className="min-w-[1050px]"><TableHeader><TableRow><TableHead>Thông báo</TableHead><TableHead>Trạng thái</TableHead><TableHead>Hiển thị</TableHead><TableHead>Đối tượng</TableHead><TableHead>Lịch</TableHead><TableHead>Analytics</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader><TableBody>
          {loading ? <TableRow><TableCell colSpan={7} className="h-52 text-center"><LoaderCircle className="mx-auto size-5 animate-spin text-muted-foreground" /></TableCell></TableRow> : items.length ? items.map((item) => <TableRow key={item.id}>
            <TableCell><div className="max-w-xs"><div className="flex items-center gap-2"><span className="truncate text-sm font-semibold">{item.title}</span><Badge variant="outline" className="h-5 text-[10px]">{announcementTypeLabels[item.type]}</Badge></div><p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">/{item.slug}</p></div></TableCell>
            <TableCell><Badge variant={item.status === "active" ? "secondary" : item.status === "expired" || item.status === "paused" ? "outline" : "default"}>{announcementStatusLabels[item.status]}</Badge></TableCell>
            <TableCell>{announcementDisplayLabels[item.displayType]}</TableCell>
            <TableCell><span className="text-sm">{item.targetType === "all" ? "Tất cả" : item.targetType === "users" ? `${item.targetRules.userIds?.length || 0} user` : (item.targetRules.roles || []).join(", ")}</span></TableCell>
            <TableCell><p className="text-xs">{formatDate(item.startsAt)}</p><p className="mt-1 text-xs text-muted-foreground">đến {formatDate(item.endsAt)}</p></TableCell>
            <TableCell><div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs"><span>Nhận: {item.analytics.eligible}</span><span>Xem: {item.analytics.seen}</span><span>Đọc: {item.analytics.read} ({item.analytics.readRate}%)</span><span>Click: {item.analytics.clicked} ({item.analytics.clickRate}%)</span></div></TableCell>
            <TableCell><div className="flex justify-end gap-1">{canUpdate ? <Button asChild size="icon-sm" variant="ghost" aria-label="Chỉnh sửa"><Link href={`/admin/announcements/${item.id}/edit`}><Pencil /></Link></Button> : null}{canPublish && ["draft", "paused", "scheduled"].includes(item.status) ? <Button size="icon-sm" variant="ghost" disabled={mutating === item.id} onClick={() => void mutate(item, "publish")} aria-label="Phát hành"><Send /></Button> : null}{canUpdate && item.status === "active" ? <Button size="icon-sm" variant="ghost" disabled={mutating === item.id} onClick={() => void mutate(item, "pause")} aria-label="Tạm dừng"><Pause /></Button> : null}{canCreate ? <Button size="icon-sm" variant="ghost" disabled={mutating === item.id} onClick={() => void mutate(item, "duplicate")} aria-label="Nhân bản"><Copy /></Button> : null}{canDelete ? <Button size="icon-sm" variant="ghost" className="hover:text-destructive" onClick={() => setDeleting(item)} aria-label="Xóa"><Trash2 /></Button> : null}</div></TableCell>
          </TableRow>) : <TableRow><TableCell colSpan={7} className="h-52 text-center text-sm text-muted-foreground">Chưa có thông báo phù hợp.</TableCell></TableRow>}
        </TableBody></Table>
      </div>
      {pagination.total > 0 ? <div className="flex flex-col gap-2 border-t px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>{pagination.total} thông báo · Trang {pagination.page}/{pagination.totalPages}</span><div className="flex gap-1"><Button variant="outline" size="icon-sm" aria-label="Trang trước" disabled={loading || page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft /></Button><Button variant="outline" size="icon-sm" aria-label="Trang sau" disabled={loading || page >= pagination.totalPages} onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}><ChevronRight /></Button></div></div> : null}
    </Card>
    <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Xóa thông báo “{deleting?.title}”?</AlertDialogTitle><AlertDialogDescription>Thông báo sẽ ngừng hiển thị và được xóa mềm khỏi danh sách quản trị.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => { if (!deleting) return; void deleteAdminAnnouncement(deleting.id).then(() => { toast.success("Đã xóa thông báo."); setDeleting(null); return load(); }).catch((error) => toast.error(error instanceof Error ? error.message : "Không thể xóa.")); }}>Xóa thông báo</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
