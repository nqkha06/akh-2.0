"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Eye, LoaderCircle, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getEmailActivity, listEmailActivity, listEmailSenders, listEmailTemplates } from "../api/emails.client";
import type { EmailMessage, EmailMessageDetail, EmailSender, EmailTemplate } from "../types";
import { EmailEmptyState, EmailStatusBadge, formatEmailDate } from "./email-ui";

export function EmailActivityTab() {
  const [items, setItems] = React.useState<EmailMessage[]>([]);
  const [templates, setTemplates] = React.useState<EmailTemplate[]>([]);
  const [senders, setSenders] = React.useState<EmailSender[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [type, setType] = React.useState("all");
  const [templateId, setTemplateId] = React.useState("all");
  const [senderId, setSenderId] = React.useState("all");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pagination, setPagination] = React.useState({ page: 1, perPage: 20, total: 0, totalPages: 1 });
  const [detail, setDetail] = React.useState<EmailMessageDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  React.useEffect(() => {
    void Promise.all([listEmailTemplates({ page: 1 }), listEmailSenders({ page: 1 })])
      .then(([templateResult, senderResult]) => { setTemplates(templateResult.items); setSenders(senderResult.items); })
      .catch(() => undefined);
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await listEmailActivity({ search, status, type, templateId, senderId, dateFrom: dateFrom ? new Date(`${dateFrom}T00:00:00`).toISOString() : undefined, dateTo: dateTo ? new Date(`${dateTo}T23:59:59.999`).toISOString() : undefined, page });
      setItems(result.items); setPagination(result.pagination);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể tải email activity."); }
    finally { setLoading(false); }
  }, [dateFrom, dateTo, page, search, senderId, status, templateId, type]);
  React.useEffect(() => { const timeout = window.setTimeout(() => void load(), 200); return () => window.clearTimeout(timeout); }, [load]);

  async function openDetail(id: string, includeRaw = false) {
    setDetailLoading(true);
    try { setDetail(await getEmailActivity(id, includeRaw)); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Không thể tải chi tiết activity."); }
    finally { setDetailLoading(false); }
  }

  return <div className="space-y-4">
    <div><h2 className="text-lg font-semibold">Email activity</h2><p className="text-sm text-muted-foreground">Lifecycle log theo message; không hiển thị full HTML trong table.</p></div>
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex flex-col gap-3 border-b p-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center"><div className="relative min-w-56 flex-1 lg:max-w-md"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} className="pl-9" placeholder="Email, provider message ID, user ID hoặc subject..." /></div><Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}><SelectTrigger className="w-full lg:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Mọi trạng thái</SelectItem>{["queued","sending","sent","delivered","opened","clicked","bounced","complained","suppressed","failed","cancelled"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select><Select value={type} onValueChange={(value) => { setType(value); setPage(1); }}><SelectTrigger className="w-full lg:w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Mọi loại</SelectItem><SelectItem value="transactional">Transactional</SelectItem><SelectItem value="marketing">Marketing</SelectItem><SelectItem value="test">Test</SelectItem></SelectContent></Select><Button variant="outline" size="icon" onClick={() => void load()} aria-label="Làm mới activity"><RefreshCw className={loading ? "animate-spin" : ""} /></Button></div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Select value={templateId} onValueChange={(value) => { setTemplateId(value); setPage(1); }}><SelectTrigger className="w-full"><SelectValue placeholder="Template" /></SelectTrigger><SelectContent><SelectItem value="all">Mọi template</SelectItem>{templates.map((template) => <SelectItem key={template.id} value={String(template.id)}>{template.name}</SelectItem>)}</SelectContent></Select><Select value={senderId} onValueChange={(value) => { setSenderId(value); setPage(1); }}><SelectTrigger className="w-full"><SelectValue placeholder="Sender" /></SelectTrigger><SelectContent><SelectItem value="all">Mọi sender</SelectItem>{senders.map((sender) => <SelectItem key={sender.id} value={String(sender.id)}>{sender.emailAddress}</SelectItem>)}</SelectContent></Select><Input type="date" aria-label="Từ ngày" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} /><Input type="date" aria-label="Đến ngày" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPage(1); }} /></div>
      </div>
      <div className="overflow-x-auto"><Table className="min-w-[1050px]"><TableHeader><TableRow><TableHead>Recipient</TableHead><TableHead>Subject / template</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Sender</TableHead><TableHead>Queued / sent</TableHead><TableHead>Delivered</TableHead><TableHead className="text-right">Detail</TableHead></TableRow></TableHeader><TableBody>
        {loading ? <TableRow><TableCell colSpan={8} className="h-52 text-center"><LoaderCircle className="mx-auto size-5 animate-spin text-muted-foreground" /></TableCell></TableRow> : items.length ? items.map((message) => <TableRow key={message.id}><TableCell><div className="max-w-60"><p className="truncate text-sm font-medium">{message.recipientEmail}</p>{message.user ? <p className="text-xs text-muted-foreground">#{message.user.id} · {message.user.name}</p> : null}</div></TableCell><TableCell><div className="max-w-sm"><p className="truncate text-sm">{message.subject}</p><p className="mt-1 truncate font-mono text-xs text-muted-foreground">{message.template?.code || "ad_hoc"}</p></div></TableCell><TableCell className="capitalize">{message.emailType}</TableCell><TableCell><EmailStatusBadge status={message.status} /></TableCell><TableCell><div className="max-w-52"><p className="truncate text-sm">{message.sender?.displayName || "—"}</p><p className="truncate text-xs text-muted-foreground">{message.fromEmail}</p></div></TableCell><TableCell className="text-xs"><p>{formatEmailDate(message.queuedAt)}</p><p className="mt-1 text-muted-foreground">{formatEmailDate(message.sentAt)}</p></TableCell><TableCell className="text-xs text-muted-foreground">{formatEmailDate(message.deliveredAt)}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon-sm" aria-label={`Xem activity ${message.id}`} onClick={() => void openDetail(message.id)}><Eye /></Button></TableCell></TableRow>) : <TableRow><TableCell colSpan={8} className="p-0"><EmailEmptyState title="Chưa có activity" description="Email messages sẽ xuất hiện sau khi hệ thống hoặc admin gửi test email." /></TableCell></TableRow>}
      </TableBody></Table></div>
      {pagination.total > 0 ? <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground"><span>{pagination.total} messages · Trang {pagination.page}/{pagination.totalPages}</span><div className="flex gap-1"><Button variant="outline" size="icon-sm" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}><ChevronLeft /></Button><Button variant="outline" size="icon-sm" disabled={page >= pagination.totalPages || loading} onClick={() => setPage((value) => value + 1)}><ChevronRight /></Button></div></div> : null}
    </Card>
    <ActivityDetailSheet detail={detail} loading={detailLoading} onOpenChange={(open) => !open && setDetail(null)} onLoadRaw={(id) => void openDetail(id, true)} />
  </div>;
}

function ActivityDetailSheet({ detail, loading, onOpenChange, onLoadRaw }: { detail: EmailMessageDetail | null; loading: boolean; onOpenChange: (open: boolean) => void; onLoadRaw: (id: string) => void }) {
  return <Sheet open={Boolean(detail) || loading} onOpenChange={onOpenChange}><SheetContent className="w-full overflow-y-auto sm:max-w-xl"><SheetHeader><SheetTitle>Email lifecycle</SheetTitle><SheetDescription>{detail?.recipientEmail || "Đang tải activity..."}</SheetDescription></SheetHeader>{loading && !detail ? <div className="flex h-52 items-center justify-center"><LoaderCircle className="animate-spin" /></div> : detail ? <div className="space-y-6 px-4 pb-6"><div className="grid grid-cols-2 gap-3 rounded-xl border bg-muted/20 p-4 text-sm"><Detail label="Status" value={<EmailStatusBadge status={detail.status} />} /><Detail label="Type" value={detail.emailType} /><Detail label="Provider message ID" value={detail.providerMessageId || "—"} mono /><Detail label="Template version" value={detail.templateVersion ? `v${detail.templateVersion}` : "—"} /><Detail label="From" value={detail.fromEmail} /><Detail label="Created" value={formatEmailDate(detail.createdAt)} /></div>{detail.failureMessage ? <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-3"><p className="text-sm font-medium text-destructive">{detail.failureCode || "Delivery failure"}</p><p className="mt-1 text-sm text-muted-foreground">{detail.failureMessage}</p></div> : null}<div><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold">Timeline</h3>{detail.rawProviderEventsAvailable && !detail.rawProviderEventsIncluded ? <Button size="sm" variant="outline" onClick={() => onLoadRaw(detail.id)}>Load raw provider JSON</Button> : null}</div>{detail.events.length ? <ol className="space-y-0">{detail.events.map((event, index) => <li key={event.id} className="relative grid grid-cols-[20px_minmax(0,1fr)] gap-3 pb-5 last:pb-0"><div className="relative flex justify-center"><span className="mt-1.5 size-2.5 rounded-full border-2 border-background bg-primary ring-1 ring-primary" />{index < detail.events.length - 1 ? <span className="absolute top-4 bottom-0 w-px bg-border" /> : null}</div><div><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium capitalize">{event.eventType.replaceAll("_", " ")}</p><time className="text-xs text-muted-foreground">{formatEmailDate(event.occurredAt)}</time></div>{event.providerEventId ? <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{event.providerEventId}</p> : null}{event.payload !== undefined ? <pre className="mt-2 max-h-64 overflow-auto rounded-lg border bg-muted/30 p-3 text-[11px] leading-5">{JSON.stringify(event.payload, null, 2)}</pre> : null}</div></li>)}</ol> : <EmailEmptyState title="Chưa có lifecycle event" description="Message mới được tạo nhưng provider chưa gửi event." />}</div></div> : null}</SheetContent></Sheet>;
}
function Detail({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) { return <div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><div className={`mt-1 break-all ${mono ? "font-mono text-xs" : "text-sm font-medium"}`}>{value}</div></div>; }
