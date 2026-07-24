"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Copy,
  LoaderCircle,
  MessageCircle,
  MessageSquarePlus,
  MoreHorizontal,
  Search,
  Send,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useSiteBrand } from "@/features/site-settings/components/site-brand-provider";
import { cn } from "@/lib/utils";

import type { SupportAttachment, SupportRequest, SupportRequestStatus } from "./types";
import type {
  SupportController,
  SupportTicketFilter,
} from "./use-support-controller";
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

export function SupportTicketList({
  controller,
  onCreate,
}: {
  controller: SupportController;
  onCreate: () => void;
}) {
  const allItems = controller.data?.requests ?? [];
  const items = controller.filteredRequests;

  return (
    <Card
      id="support-tickets"
      className="gap-0 overflow-hidden rounded-lg py-0 shadow-none"
    >
      <div className="border-b border-border px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">Ticket của tôi</h2>
              <Badge
                variant="secondary"
                className="rounded-full font-normal tabular-nums"
              >
                {allItems.length}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Theo dõi trạng thái và tiếp tục trao đổi với đội ngũ hỗ trợ.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <div className="relative min-w-0 flex-1 lg:w-72">
              <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="support-ticket-search"
                value={controller.query}
                onChange={(event) => controller.setQuery(event.target.value)}
                placeholder="Tìm mã, tiêu đề hoặc loại..."
                className="h-9 pl-9 pr-9 shadow-none"
              />
              {controller.query ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-0.5 top-0.5"
                  aria-label="Xóa từ khóa"
                  onClick={() => controller.setQuery("")}
                >
                  <X />
                </Button>
              ) : null}
            </div>
            <Select
              value={controller.statusFilter}
              onValueChange={(value) =>
                controller.setStatusFilter(value as SupportTicketFilter)
              }
            >
              <SelectTrigger
                className="h-9 w-full shadow-none sm:w-44"
                aria-label="Lọc trạng thái ticket"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Đang xử lý</SelectItem>
                <SelectItem value="waiting_user">Chờ bạn phản hồi</SelectItem>
                <SelectItem value="resolved">Đã hoàn tất</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {items.length ? (
        <>
          <div className="hidden overflow-x-auto md:block">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  <TableHead>Mã ticket</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Loại yêu cầu</TableHead>
                  <TableHead>Cập nhật gần nhất</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Thao tác</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((request) => (
                  <TableRow key={request.id} className="h-16">
                    <TableCell>
                      <button
                        type="button"
                        className="font-mono text-xs font-medium hover:text-primary"
                        onClick={() => controller.openRequest(request)}
                      >
                        {request.reference}
                      </button>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="max-w-72 truncate text-left text-sm font-medium hover:text-primary"
                        onClick={() => controller.openRequest(request)}
                      >
                        {request.subject}
                      </button>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {request.category}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums text-muted-foreground">
                      {formatSupportDate(request.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <SupportStatusBadge status={request.status} />
                    </TableCell>
                    <TableCell>
                      <RequestActions
                        request={request}
                        onOpen={controller.openRequest}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="divide-y divide-border md:hidden">
            {items.map((request) => (
              <button
                key={request.id}
                type="button"
                className="flex min-h-28 w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/30"
                onClick={() => controller.openRequest(request)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs text-muted-foreground">
                      {request.reference}
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {formatSupportDate(request.updatedAt)}
                    </span>
                  </div>
                  <p className="mt-2 truncate text-sm font-medium">
                    {request.subject}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <SupportStatusBadge status={request.status} />
                    <span className="truncate text-xs text-muted-foreground">
                      {request.category}
                    </span>
                  </div>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>

          <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground sm:px-5">
            Hiển thị {items.length} trên tổng số {allItems.length} ticket
          </div>
        </>
      ) : (
        <SupportEmptyState
          filtered={controller.hasFilters}
          onCreate={onCreate}
          onClear={controller.clearFilters}
        />
      )}
    </Card>
  );
}

function RequestActions({ request, onOpen }: { request: SupportRequest; onOpen: (request: SupportRequest) => void }) {
  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`Thao tác cho ${request.reference}`}><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => onOpen(request)}><ChevronRight />Xem yêu cầu</DropdownMenuItem><DropdownMenuItem onClick={() => { void navigator.clipboard.writeText(request.reference); toast.success("Đã sao chép mã yêu cầu."); }}><Copy />Sao chép mã</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}

export function SupportEmptyState({
  filtered,
  onCreate,
  onClear,
}: {
  filtered: boolean;
  onCreate: () => void;
  onClear: () => void;
}) {
  return (
    <div className="px-4 py-14 text-center">
      <span className="mx-auto grid size-10 place-items-center rounded-full border bg-muted/30 text-muted-foreground">
        <MessageCircle className="size-4" />
      </span>
      <p className="mt-4 text-sm font-medium">
        {filtered
          ? "Không tìm thấy ticket phù hợp."
          : "Bạn chưa có ticket hỗ trợ nào."}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
        {filtered
          ? "Thử thay đổi từ khóa hoặc bộ lọc trạng thái."
          : "Tạo ticket mới và theo dõi toàn bộ quá trình xử lý ngay tại đây."}
      </p>
      <Button
        className="mt-4"
        variant={filtered ? "outline" : "default"}
        onClick={filtered ? onClear : onCreate}
      >
        {filtered ? <X /> : <MessageSquarePlus />}
        {filtered ? "Xóa bộ lọc" : "Tạo ticket đầu tiên"}
      </Button>
    </div>
  );
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
  return <Sheet open onOpenChange={(open) => { if (!open && !sending) controller.setDetailRequest(undefined); }}><SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-xl"><SheetHeader className="border-b border-border px-5 py-5 sm:px-6"><div className="pr-8"><SheetTitle>{request.subject}</SheetTitle><SheetDescription className="mt-1 font-mono">{request.reference}</SheetDescription></div><div className="pt-2"><SupportStatusBadge status={request.status} /></div></SheetHeader><div className="space-y-6 px-5 py-5 sm:px-6"><dl className="grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-xs text-muted-foreground">Chủ đề</dt><dd className="mt-1 font-medium">{request.category}</dd></div><div><dt className="text-xs text-muted-foreground">Ngày tạo</dt><dd className="mt-1 font-medium tabular-nums">{formatSupportDate(request.createdAt)}</dd></div><div><dt className="text-xs text-muted-foreground">Cập nhật gần nhất</dt><dd className="mt-1 font-medium tabular-nums">{formatSupportDate(request.updatedAt)}</dd></div><div><dt className="text-xs text-muted-foreground">Tệp đính kèm</dt><dd className="mt-1 font-medium">{request.attachments.length ? <AttachmentLinks attachments={request.attachments} /> : "Không có"}</dd></div></dl><Separator /><SupportConversation request={request} /><Separator /><div className="space-y-2"><label htmlFor="support-reply" className="text-sm font-medium">Phản hồi</label><Textarea id="support-reply" value={reply} onChange={(event) => setReply(event.target.value)} placeholder={replyDisabled ? "Yêu cầu này đã đóng" : "Nhập phản hồi của bạn..."} disabled={replyDisabled || sending} className="min-h-24 resize-y" aria-invalid={Boolean(error)} />{error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}<div className="flex justify-end"><Button disabled={replyDisabled || sending} onClick={() => void sendReply()}>{sending ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <Send />}{sending ? "Đang gửi…" : "Gửi phản hồi"}</Button></div>{replyDisabled ? <p className="text-xs text-muted-foreground">Yêu cầu đã đóng nên không thể gửi thêm phản hồi.</p> : null}</div></div></SheetContent></Sheet>;
}

export function SupportConversation({ request }: { request: SupportRequest }) {
  const brand = useSiteBrand();
  return <section aria-labelledby="support-conversation-title"><h3 id="support-conversation-title" className="text-sm font-semibold">Trao đổi</h3><div className="mt-4 space-y-5">{request.messages.map((message) => <article key={message.id} className="flex gap-3"><div className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-muted/30">{message.senderRole === "support" ? <MessageCircle className="size-4 text-primary" /> : <UserRound className="size-4 text-muted-foreground" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="text-sm font-medium">{message.sender}</span><span className="text-xs text-muted-foreground">{message.senderRole === "support" ? `Đội ngũ ${brand.siteName}` : "Bạn"}</span><time className="text-xs tabular-nums text-muted-foreground">{formatSupportDate(message.createdAt)}</time></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground/90">{message.content}</p>{message.attachments?.length ? <div className="mt-2"><AttachmentLinks attachments={message.attachments} /></div> : null}</div></article>)}</div></section>;
}

function AttachmentLinks({ attachments }: { attachments: SupportAttachment[] }) {
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      {attachments.map((attachment) => (
        <Button key={attachment.id} asChild variant="outline" size="sm">
          <a
            href={`/api/backend${attachment.downloadPath}`}
            target="_blank"
            rel="noreferrer"
          >
            {attachment.name}
          </a>
        </Button>
      ))}
    </span>
  );
}
