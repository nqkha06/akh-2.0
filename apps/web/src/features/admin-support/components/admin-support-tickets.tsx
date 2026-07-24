"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Download,
  Inbox,
  LoaderCircle,
  MessageCircle,
  Paperclip,
  Search,
  Send,
  ShieldAlert,
  UserCheck,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import type {
  SupportCategory,
  SupportRequestStatus,
  SupportTicketPriority,
} from "@/components/dashboard/support/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import {
  getAdminSupportTicket,
  getAdminSupportTickets,
  replyAdminSupportTicket,
  updateAdminSupportTicket,
} from "../api/admin-support.client";
import type {
  AdminSupportTicket,
  AdminSupportTicketsResponse,
} from "../types";

const statusOptions: Array<{
  value: SupportRequestStatus;
  label: string;
}> = [
  { value: "submitted", label: "Mới gửi" },
  { value: "in_progress", label: "Đang xử lý" },
  { value: "waiting_user", label: "Chờ member" },
  { value: "answered", label: "Đã trả lời" },
  { value: "resolved", label: "Đã giải quyết" },
  { value: "closed", label: "Đã đóng" },
];

const priorityOptions: Array<{
  value: SupportTicketPriority;
  label: string;
}> = [
  { value: "low", label: "Thấp" },
  { value: "normal", label: "Bình thường" },
  { value: "high", label: "Cao" },
  { value: "urgent", label: "Khẩn cấp" },
];

const categoryOptions: Array<{ value: SupportCategory; label: string }> = [
  { value: "usage", label: "Câu hỏi sử dụng" },
  { value: "technical", label: "Lỗi kỹ thuật" },
  { value: "social_links", label: "Social links" },
  { value: "files", label: "Files" },
  { value: "link_in_bio", label: "Link-in-bio" },
  { value: "monetization", label: "Kiếm tiền" },
  { value: "withdrawal", label: "Rút tiền" },
  { value: "rewards", label: "Phần thưởng" },
  { value: "account", label: "Tài khoản và bảo mật" },
  { value: "abuse", label: "Báo cáo lạm dụng" },
  { value: "other", label: "Khác" },
];

export function AdminSupportTickets() {
  const permissions = useAdminPermissions();
  const canReply = permissions.includes("support.reply");
  const canManage = permissions.includes("support.manage");
  const [result, setResult] = useState<AdminSupportTicketsResponse>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SupportRequestStatus | "all">("all");
  const [priority, setPriority] =
    useState<SupportTicketPriority | "all">("all");
  const [category, setCategory] = useState<SupportCategory | "all">("all");
  const [assignment, setAssignment] =
    useState<"all" | "mine" | "unassigned">("all");
  const [page, setPage] = useState(1);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<AdminSupportTicket>();
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setResult(
        await getAdminSupportTickets({
          search: search.trim() || undefined,
          status,
          priority,
          category,
          assignment,
          page,
        }),
      );
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải hàng đợi hỗ trợ.",
      );
    } finally {
      setLoading(false);
    }
  }, [assignment, category, page, priority, search, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  const openTicket = async (id: number) => {
    setDetailOpen(true);
    setDetail(undefined);
    try {
      setDetailLoading(true);
      setDetail(await getAdminSupportTicket(id));
    } catch (openError) {
      toast.error(
        openError instanceof Error
          ? openError.message
          : "Không thể mở ticket.",
      );
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const resetPage = (change: () => void) => {
    setPage(1);
    change();
  };

  return (
    <div className="space-y-5">
      <SupportSummary result={result} loading={loading && !result} />

      <Card className="gap-0 overflow-hidden py-0 shadow-none">
        <div className="grid gap-3 border-b p-4 lg:grid-cols-[minmax(240px,1fr)_180px_160px_180px_160px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) =>
                resetPage(() => setSearch(event.target.value))
              }
              placeholder="Tìm mã, tiêu đề, member hoặc email..."
              className="pl-9"
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) =>
              resetPage(() =>
                setStatus(value as SupportRequestStatus | "all"),
              )
            }
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi trạng thái</SelectItem>
              {statusOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={priority}
            onValueChange={(value) =>
              resetPage(() =>
                setPriority(value as SupportTicketPriority | "all"),
              )
            }
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi ưu tiên</SelectItem>
              {priorityOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={category}
            onValueChange={(value) =>
              resetPage(() =>
                setCategory(value as SupportCategory | "all"),
              )
            }
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi chủ đề</SelectItem>
              {categoryOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={assignment}
            onValueChange={(value) =>
              resetPage(() =>
                setAssignment(value as typeof assignment),
              )
            }
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi phân công</SelectItem>
              <SelectItem value="mine">Của tôi</SelectItem>
              <SelectItem value="unassigned">Chưa phân công</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error ? (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Không thể tải ticket</AlertTitle>
              <AlertDescription className="flex items-center justify-between gap-3">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={() => void load()}>
                  Thử lại
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : loading && !result ? (
          <TicketTableSkeleton />
        ) : result?.items.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <Table className="min-w-[980px]">
                <TableHeader>
                  <TableRow className="bg-muted/20">
                    <TableHead>Ticket</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ưu tiên</TableHead>
                    <TableHead>Phân công</TableHead>
                    <TableHead className="text-right">Cập nhật</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.items.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      tabIndex={0}
                      className="h-20 cursor-pointer"
                      onClick={() => void openTicket(ticket.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          void openTicket(ticket.id);
                        }
                      }}
                    >
                      <TableCell>
                        <p className="font-mono text-xs text-muted-foreground">
                          {ticket.reference}
                        </p>
                        <p className="mt-1 max-w-80 truncate text-sm font-medium">
                          {ticket.subject}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {categoryLabel(ticket.category)} · {ticket.messageCount} tin nhắn
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="max-w-48 truncate text-sm font-medium">
                          {ticket.user.name}
                        </p>
                        <p className="max-w-48 truncate text-xs text-muted-foreground">
                          {ticket.user.email}
                        </p>
                      </TableCell>
                      <TableCell><StatusBadge status={ticket.status} /></TableCell>
                      <TableCell><PriorityBadge priority={ticket.priority} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {ticket.assignedTo?.name || "Chưa phân công"}
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                        {formatDate(ticket.lastMessageAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="divide-y md:hidden">
              {result.items.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  className="w-full p-4 text-left hover:bg-muted/30"
                  onClick={() => void openTicket(ticket.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-foreground">{ticket.reference}</p>
                      <p className="mt-1 truncate text-sm font-medium">{ticket.subject}</p>
                    </div>
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <StatusBadge status={ticket.status} />
                    <span className="truncate text-xs text-muted-foreground">
                      {ticket.user.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="px-4 py-16 text-center">
            <Inbox className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">Không có ticket phù hợp.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Thay đổi bộ lọc hoặc chờ yêu cầu mới từ member.
            </p>
          </div>
        )}

        {result ? (
          <div className="flex items-center justify-between gap-4 border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {result.pagination.total} ticket
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => current - 1)}
              >
                Trước
              </Button>
              <span className="text-xs tabular-nums text-muted-foreground">
                {result.pagination.page}/{result.pagination.pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= result.pagination.pageCount || loading}
                onClick={() => setPage((current) => current + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      <TicketDetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        ticket={detail}
        loading={detailLoading}
        canReply={canReply}
        canManage={canManage}
        onUpdated={(updated) => {
          setDetail(updated);
          void load();
        }}
      />
    </div>
  );
}

function SupportSummary({
  result,
  loading,
}: {
  result?: AdminSupportTicketsResponse;
  loading: boolean;
}) {
  const metrics = [
    { label: "Đang mở", value: result?.summary.open, icon: MessageCircle },
    { label: "Chờ member", value: result?.summary.waiting, icon: Clock3 },
    { label: "Khẩn cấp", value: result?.summary.urgent, icon: ShieldAlert },
    { label: "Chưa phân công", value: result?.summary.unassigned, icon: UserRound },
  ];
  return (
    <div className="grid overflow-hidden rounded-xl border bg-card sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(({ label, value, icon: Icon }) => (
        <div key={label} className="flex items-center gap-3 border-b p-4 last:border-b-0 sm:border-r sm:[&:nth-child(2)]:border-r-0 xl:border-b-0 xl:[&:nth-child(2)]:border-r">
          <span className="grid size-9 place-items-center rounded-lg bg-muted/50 text-muted-foreground"><Icon className="size-4" /></span>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            {loading ? <Skeleton className="mt-1 h-6 w-10" /> : <p className="mt-0.5 text-xl font-semibold tabular-nums">{value ?? 0}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function TicketDetailSheet({
  open,
  onOpenChange,
  ticket,
  loading,
  canReply,
  canManage,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket?: AdminSupportTicket;
  loading: boolean;
  canReply: boolean;
  canManage: boolean;
  onUpdated: (ticket: AdminSupportTicket) => void;
}) {
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const update = async (input: Parameters<typeof updateAdminSupportTicket>[1]) => {
    if (!ticket) return;
    try {
      setBusy(true);
      const updated = await updateAdminSupportTicket(ticket.id, input);
      onUpdated(updated);
      toast.success("Đã cập nhật ticket.");
    } catch (updateError) {
      toast.error(updateError instanceof Error ? updateError.message : "Không thể cập nhật ticket.");
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async () => {
    if (!ticket || !reply.trim()) return;
    try {
      setBusy(true);
      const updated = await replyAdminSupportTicket(ticket.id, reply.trim());
      setReply("");
      onUpdated(updated);
      toast.success("Đã gửi phản hồi tới member.");
    } catch (replyError) {
      toast.error(replyError instanceof Error ? replyError.message : "Không thể gửi phản hồi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-2xl">
        {loading || !ticket ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-7 w-72" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-56 w-full" />
          </div>
        ) : (
          <>
            <SheetHeader className="border-b px-5 py-5 sm:px-6">
              <div className="pr-8">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-mono">{ticket.reference}</Badge>
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                </div>
                <SheetTitle className="mt-3">{ticket.subject}</SheetTitle>
                <SheetDescription className="mt-1">
                  {ticket.user.name} · {ticket.user.email}
                </SheetDescription>
              </div>
            </SheetHeader>

            <div className="space-y-6 px-5 py-5 sm:px-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Trạng thái</p>
                  <Select
                    value={ticket.status}
                    disabled={!canManage || busy}
                    onValueChange={(value) => void update({ status: value as SupportRequestStatus })}
                  >
                    <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>{statusOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Độ ưu tiên</p>
                  <Select
                    value={ticket.priority}
                    disabled={!canManage || busy}
                    onValueChange={(value) => void update({ priority: value as SupportTicketPriority })}
                  >
                    <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>{priorityOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">Người xử lý</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {ticket.assignedTo
                      ? `${ticket.assignedTo.name} · ${ticket.assignedTo.email}`
                      : "Ticket chưa được phân công."}
                  </p>
                </div>
                {canManage ? (
                  ticket.assignedTo ? (
                    <Button variant="outline" size="sm" disabled={busy} onClick={() => void update({ unassign: true })}>
                      Bỏ gán
                    </Button>
                  ) : (
                    <Button size="sm" disabled={busy} onClick={() => void update({ assignToMe: true })}>
                      <UserCheck />Nhận xử lý
                    </Button>
                  )
                ) : null}
              </div>

              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div><dt className="text-xs text-muted-foreground">Chủ đề</dt><dd className="mt-1 font-medium">{ticket.category}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Ngày tạo</dt><dd className="mt-1 font-medium">{formatDate(ticket.createdAt)}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Đối tượng liên quan</dt><dd className="mt-1 font-medium">{ticket.relatedResource || "Không có"}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Tệp đính kèm</dt><dd className="mt-1 font-medium">{ticket.attachments.length}</dd></div>
              </dl>

              {ticket.technicalInfo ? (
                <details className="rounded-lg border bg-muted/20 p-3">
                  <summary className="cursor-pointer text-sm font-medium">Thông tin kỹ thuật</summary>
                  <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">{prettyTechnicalInfo(ticket.technicalInfo)}</pre>
                </details>
              ) : null}

              <Separator />
              <div>
                <h3 className="text-sm font-semibold">Hội thoại</h3>
                <div className="mt-4 space-y-4">
                  {ticket.messages.map((message) => (
                    <article
                      key={message.id}
                      className={message.senderRole === "system"
                        ? "rounded-lg border border-dashed bg-muted/20 px-3 py-2"
                        : "flex gap-3"}
                    >
                      {message.senderRole !== "system" ? (
                        <span className="grid size-8 shrink-0 place-items-center rounded-full border bg-muted/30">
                          {message.senderRole === "support" ? <MessageCircle className="size-4 text-primary" /> : <UserRound className="size-4 text-muted-foreground" />}
                        </span>
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">{message.sender}</span>
                          {message.isInternal ? <Badge variant="outline">Nội bộ</Badge> : null}
                          <time className="text-xs text-muted-foreground">{formatDate(message.createdAt)}</time>
                        </div>
                        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-foreground/90">{message.content}</p>
                        {message.attachments?.length ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {message.attachments.map((file) => (
                              <Button key={file.id} asChild variant="outline" size="sm">
                                <a href={`/api/backend${file.downloadPath}`} target="_blank" rel="noreferrer">
                                  <Paperclip />{file.name}<Download />
                                </a>
                              </Button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <Separator />
              <div className="space-y-2">
                <label htmlFor="admin-support-reply" className="text-sm font-medium">Phản hồi member</label>
                <Textarea
                  id="admin-support-reply"
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  disabled={!canReply || busy || ticket.status === "closed"}
                  placeholder={ticket.status === "closed" ? "Mở lại ticket để phản hồi" : "Nhập nội dung phản hồi rõ ràng, có bước xử lý tiếp theo..."}
                  className="min-h-28 resize-y"
                />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Phản hồi sẽ chuyển ticket sang “Chờ member”.
                  </p>
                  <Button disabled={!canReply || busy || !reply.trim() || ticket.status === "closed"} onClick={() => void sendReply()}>
                    {busy ? <LoaderCircle className="animate-spin" /> : <Send />}
                    Gửi phản hồi
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function StatusBadge({ status }: { status: SupportRequestStatus }) {
  const label = statusOptions.find((item) => item.value === status)?.label || status;
  const terminal = status === "resolved" || status === "closed";
  return (
    <Badge
      variant={terminal ? "secondary" : "outline"}
      className={status === "waiting_user" ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" : ""}
    >
      {terminal ? <CheckCircle2 /> : <Clock3 />}{label}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: SupportTicketPriority }) {
  const label = priorityOptions.find((item) => item.value === priority)?.label || priority;
  return (
    <Badge
      variant="outline"
      className={priority === "urgent"
        ? "border-destructive/30 bg-destructive/10 text-destructive"
        : priority === "high"
          ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
          : ""}
    >
      {label}
    </Badge>
  );
}

function categoryLabel(value: SupportCategory) {
  return categoryOptions.find((item) => item.value === value)?.label || value;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function prettyTechnicalInfo(value: string) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function TicketTableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}
