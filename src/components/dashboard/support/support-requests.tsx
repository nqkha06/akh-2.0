"use client";

import { useState } from "react";
import { CheckCircle2, ChevronRight, CircleDot, Clock3, Copy, LoaderCircle, MessageCircle, MoreHorizontal, Send, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import type { SupportRequest, SupportRequestStatus } from "./types";
import type { SupportController } from "./use-support-controller";
import { formatSupportDate } from "./use-support-controller";

const statusConfig: Record<SupportRequestStatus, { label: string; icon: typeof Clock3; className: string }> = {
  submitted: { label: "Đã gửi", icon: Send, className: "bg-muted text-foreground" },
  in_progress: { label: "Đang xử lý", icon: Clock3, className: "bg-primary/10 text-primary" },
  waiting_user: { label: "Đang chờ bạn phản hồi", icon: MessageCircle, className: "bg-primary/10 text-primary" },
  answered: { label: "Đã trả lời", icon: MessageCircle, className: "bg-primary/10 text-primary" },
  resolved: { label: "Đã giải quyết", icon: CheckCircle2, className: "bg-primary/10 text-primary" },
  closed: { label: "Đã đóng", icon: CircleDot, className: "bg-muted text-muted-foreground" },
};

export function SupportStatusBadge({ status }: { status: SupportRequestStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return <Badge variant="secondary" className={cn("whitespace-nowrap font-medium", config.className)}><Icon />{config.label}</Badge>;
}

export function RecentSupportRequests({ items, onOpen }: { items: SupportRequest[]; onOpen: (request: SupportRequest) => void }) {
  return <section id="recent-support-requests" aria-labelledby="recent-support-title"><div><h2 id="recent-support-title" className="text-lg font-semibold tracking-[-0.015em]">Yêu cầu hỗ trợ gần đây</h2><p className="mt-1 text-sm text-muted-foreground">Theo dõi trạng thái và phản hồi mới nhất từ đội ngũ hỗ trợ.</p></div>{items.length ? <div className="mt-4 overflow-hidden border-y border-border"><div className="hidden overflow-x-auto md:block"><Table className="min-w-[800px]"><TableHeader><TableRow className="bg-muted/20"><TableHead>Mã yêu cầu</TableHead><TableHead>Tiêu đề</TableHead><TableHead>Chủ đề</TableHead><TableHead>Cập nhật gần nhất</TableHead><TableHead>Trạng thái</TableHead><TableHead className="w-12"><span className="sr-only">Thao tác</span></TableHead></TableRow></TableHeader><TableBody>{items.map((request) => <TableRow key={request.id} className="h-16"><TableCell><button type="button" className="font-mono text-xs font-medium hover:text-primary" onClick={() => onOpen(request)}>{request.reference}</button></TableCell><TableCell><button type="button" className="max-w-72 truncate text-left text-sm font-medium hover:text-primary" onClick={() => onOpen(request)}>{request.subject}</button></TableCell><TableCell className="text-sm text-muted-foreground">{request.category}</TableCell><TableCell className="text-sm tabular-nums text-muted-foreground">{formatSupportDate(request.updatedAt)}</TableCell><TableCell><SupportStatusBadge status={request.status} /></TableCell><TableCell><RequestActions request={request} onOpen={onOpen} /></TableCell></TableRow>)}</TableBody></Table></div><div className="divide-y divide-border md:hidden">{items.map((request) => <button key={request.id} type="button" className="flex min-h-24 w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/30" onClick={() => onOpen(request)}><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><span className="font-mono text-xs text-muted-foreground">{request.reference}</span><span className="text-xs tabular-nums text-muted-foreground">{formatSupportDate(request.updatedAt)}</span></div><p className="mt-2 truncate text-sm font-medium">{request.subject}</p><div className="mt-2"><SupportStatusBadge status={request.status} /></div></div><ChevronRight className="size-4 shrink-0 text-muted-foreground" /></button>)}</div></div> : <SupportEmptyState />}</section>;
}

function RequestActions({ request, onOpen }: { request: SupportRequest; onOpen: (request: SupportRequest) => void }) {
  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`Thao tác cho ${request.reference}`}><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => onOpen(request)}><ChevronRight />Xem yêu cầu</DropdownMenuItem><DropdownMenuItem onClick={() => { void navigator.clipboard.writeText(request.reference); toast.success("Đã sao chép mã yêu cầu."); }}><Copy />Sao chép mã</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}

export function SupportEmptyState() {
  return <div className="mt-4 border-y border-border px-4 py-10 text-center"><MessageCircle className="mx-auto size-7 text-muted-foreground" /><p className="mt-3 text-sm font-medium">Bạn chưa có yêu cầu hỗ trợ nào.</p><p className="mt-1 text-sm text-muted-foreground">Các yêu cầu bạn gửi sẽ xuất hiện tại đây.</p></div>;
}

export function SupportRequestDetail({ controller }: { controller: SupportController }) {
  const request = controller.detailRequest;
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  if (!request) return null;
  const sendReply = async () => {
    if (!reply.trim()) { setError("Vui lòng nhập nội dung phản hồi."); return; }
    try { setSending(true); setError(""); await controller.reply(request.id, reply.trim()); setReply(""); } catch (replyError) { setError(replyError instanceof Error ? replyError.message : "Không thể gửi phản hồi."); } finally { setSending(false); }
  };
  const replyDisabled = request.status === "closed";
  return <Sheet open onOpenChange={(open) => { if (!open && !sending) controller.setDetailRequest(undefined); }}><SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-xl"><SheetHeader className="border-b border-border px-5 py-5 sm:px-6"><div className="pr-8"><SheetTitle>{request.subject}</SheetTitle><SheetDescription className="mt-1 font-mono">{request.reference}</SheetDescription></div><div className="pt-2"><SupportStatusBadge status={request.status} /></div></SheetHeader><div className="space-y-6 px-5 py-5 sm:px-6"><dl className="grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-xs text-muted-foreground">Chủ đề</dt><dd className="mt-1 font-medium">{request.category}</dd></div><div><dt className="text-xs text-muted-foreground">Ngày tạo</dt><dd className="mt-1 font-medium tabular-nums">{formatSupportDate(request.createdAt)}</dd></div><div><dt className="text-xs text-muted-foreground">Cập nhật gần nhất</dt><dd className="mt-1 font-medium tabular-nums">{formatSupportDate(request.updatedAt)}</dd></div><div><dt className="text-xs text-muted-foreground">Tệp đính kèm</dt><dd className="mt-1 font-medium">{request.attachments.length ? request.attachments.join(", ") : "Không có"}</dd></div></dl><Separator /><SupportConversation request={request} /><Separator /><div className="space-y-2"><label htmlFor="support-reply" className="text-sm font-medium">Phản hồi</label><Textarea id="support-reply" value={reply} onChange={(event) => setReply(event.target.value)} placeholder={replyDisabled ? "Yêu cầu này đã đóng" : "Nhập phản hồi của bạn..."} disabled={replyDisabled || sending} className="min-h-24 resize-y" aria-invalid={Boolean(error)} />{error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}<div className="flex justify-end"><Button disabled={replyDisabled || sending} onClick={() => void sendReply()}>{sending ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <Send />}{sending ? "Đang gửi…" : "Gửi phản hồi"}</Button></div>{replyDisabled ? <p className="text-xs text-muted-foreground">Yêu cầu đã đóng nên không thể gửi thêm phản hồi.</p> : null}</div></div></SheetContent></Sheet>;
}

export function SupportConversation({ request }: { request: SupportRequest }) {
  return <section aria-labelledby="support-conversation-title"><h3 id="support-conversation-title" className="text-sm font-semibold">Trao đổi</h3><div className="mt-4 space-y-5">{request.messages.map((message) => <article key={message.id} className="flex gap-3"><div className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-muted/30">{message.senderRole === "support" ? <MessageCircle className="size-4 text-primary" /> : <UserRound className="size-4 text-muted-foreground" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="text-sm font-medium">{message.sender}</span><span className="text-xs text-muted-foreground">{message.senderRole === "support" ? "Đội ngũ Rekonise" : "Bạn"}</span><time className="text-xs tabular-nums text-muted-foreground">{formatSupportDate(message.createdAt)}</time></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground/90">{message.content}</p>{message.attachments?.length ? <p className="mt-2 text-xs text-muted-foreground">Đính kèm: {message.attachments.join(", ")}</p> : null}</div></article>)}</div></section>;
}
