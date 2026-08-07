"use client";

import {
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  Clock3,
  ExternalLink,
  Flag,
  Inbox,
  Loader2,
  Mail,
  Search,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  deleteAdminLinkReport,
  getAdminLinkReport,
  getAdminLinkReports,
  updateAdminLinkReport,
} from "@/features/admin-link-reports/api/admin-link-reports.client";
import type {
  AdminLinkReport,
  AdminLinkReportsResponse,
  LinkReportReason,
  LinkReportStatus,
} from "@/features/admin-link-reports/types";

const statusOptions: Array<{ value: LinkReportStatus; label: string }> = [
  { value: "pending", label: "Chờ xử lý" },
  { value: "reviewing", label: "Đang kiểm tra" },
  { value: "resolved", label: "Đã xử lý" },
  { value: "dismissed", label: "Đã bỏ qua" },
];

const reasonOptions: Array<{ value: LinkReportReason; label: string }> = [
  { value: "spam", label: "Spam / gây hiểu nhầm" },
  { value: "malware", label: "Lừa đảo / mã độc" },
  { value: "impersonation", label: "Mạo danh" },
  { value: "copyright", label: "Bản quyền" },
  { value: "adult", label: "Nội dung không phù hợp" },
  { value: "other", label: "Khác" },
];

export function AdminLinkReports() {
  const permissions = useAdminPermissions();
  const canManage = permissions.includes("link-reports.manage");
  const canDelete = permissions.includes("link-reports.delete");
  const [result, setResult] = useState<AdminLinkReportsResponse>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LinkReportStatus | "all">("all");
  const [reason, setReason] = useState<LinkReportReason | "all">("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "updated">("newest");
  const [page, setPage] = useState(1);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<AdminLinkReport>();
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setResult(
        await getAdminLinkReports({
          search: search.trim() || undefined,
          status,
          reason,
          sort,
          page,
        }),
      );
      setError("");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Không thể tải báo cáo liên kết.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, reason, search, sort, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function openReport(id: number) {
    setDetailOpen(true);
    setDetail(undefined);
    setDetailLoading(true);
    try {
      setDetail(await getAdminLinkReport(id));
    } catch (failure) {
      toast.error(
        failure instanceof Error ? failure.message : "Không thể mở báo cáo.",
      );
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  }

  function resetPage(change: () => void) {
    setPage(1);
    change();
  }

  return (
    <div className="space-y-5">
      <ReportSummary result={result} loading={loading && !result} />

      <Card className="gap-0 overflow-hidden py-0 shadow-none">
        <div className="grid gap-3 border-b p-4 lg:grid-cols-[minmax(260px,1fr)_180px_190px_170px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(event) =>
                resetPage(() => setSearch(event.target.value))
              }
              placeholder="Tìm mã, email, URL hoặc nội dung..."
              value={search}
            />
          </div>
          <Select
            onValueChange={(value) =>
              resetPage(() => setStatus(value as LinkReportStatus | "all"))
            }
            value={status}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi trạng thái</SelectItem>
              {statusOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            onValueChange={(value) =>
              resetPage(() => setReason(value as LinkReportReason | "all"))
            }
            value={reason}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mọi lý do</SelectItem>
              {reasonOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            onValueChange={(value) =>
              resetPage(() => setSort(value as typeof sort))
            }
            value={sort}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mới nhất</SelectItem>
              <SelectItem value="oldest">Cũ nhất</SelectItem>
              <SelectItem value="updated">Mới cập nhật</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error ? (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Không thể tải báo cáo</AlertTitle>
              <AlertDescription className="flex items-center justify-between gap-3">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={() => void load()}>
                  Thử lại
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : loading && !result ? (
          <ReportTableSkeleton />
        ) : result?.items.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <Table className="min-w-[980px]">
                <TableHeader>
                  <TableRow className="bg-muted/20">
                    <TableHead>Báo cáo</TableHead>
                    <TableHead>Người gửi</TableHead>
                    <TableHead>Lý do</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Người xử lý</TableHead>
                    <TableHead className="text-right">Thời gian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.items.map((report) => (
                    <TableRow
                      className="h-20 cursor-pointer"
                      key={report.id}
                      onClick={() => void openReport(report.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          void openReport(report.id);
                        }
                      }}
                      tabIndex={0}
                    >
                      <TableCell>
                        <p className="font-mono text-xs text-muted-foreground">
                          {report.reference}
                        </p>
                        <p className="mt-1 max-w-80 truncate text-sm font-medium">
                          {report.reportedUrl}
                        </p>
                      </TableCell>
                      <TableCell className="max-w-56 truncate text-sm">
                        {report.email}
                      </TableCell>
                      <TableCell><ReasonBadge reason={report.reason} /></TableCell>
                      <TableCell><StatusBadge status={report.status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {report.reviewedBy?.name || "Chưa có"}
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                        {formatDate(report.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="divide-y md:hidden">
              {result.items.map((report) => (
                <button
                  className="w-full p-4 text-left transition-colors hover:bg-muted/30"
                  key={report.id}
                  onClick={() => void openReport(report.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-foreground">{report.reference}</p>
                      <p className="mt-1 truncate text-sm font-medium">{report.reportedUrl}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{report.email}</p>
                    </div>
                    <StatusBadge status={report.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <ReasonBadge reason={report.reason} />
                    <span className="text-xs text-muted-foreground">{formatDate(report.createdAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="px-4 py-16 text-center">
            <Inbox className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">Không có báo cáo phù hợp.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Thay đổi bộ lọc hoặc chờ báo cáo mới từ giao diện public.
            </p>
          </div>
        )}

        {result ? (
          <div className="flex items-center justify-between gap-4 border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">{result.pagination.total} báo cáo</p>
            <div className="flex items-center gap-2">
              <Button
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => current - 1)}
                size="sm"
                variant="outline"
              >
                Trước
              </Button>
              <span className="text-xs tabular-nums text-muted-foreground">
                {result.pagination.page}/{result.pagination.pageCount}
              </span>
              <Button
                disabled={page >= result.pagination.pageCount || loading}
                onClick={() => setPage((current) => current + 1)}
                size="sm"
                variant="outline"
              >
                Sau
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      <ReportDetailSheet
        canDelete={canDelete}
        canManage={canManage}
        loading={detailLoading}
        onDeleted={() => {
          setDetailOpen(false);
          setDetail(undefined);
          void load();
        }}
        onOpenChange={setDetailOpen}
        onUpdated={(updated) => {
          setDetail(updated);
          void load();
        }}
        open={detailOpen}
        report={detail}
      />
    </div>
  );
}

function ReportSummary({
  result,
  loading,
}: {
  result?: AdminLinkReportsResponse;
  loading: boolean;
}) {
  const items = [
    { key: "pending", label: "Chờ xử lý", icon: Clock3 },
    { key: "reviewing", label: "Đang kiểm tra", icon: CircleDashed },
    { key: "resolved", label: "Đã xử lý", icon: CheckCircle2 },
    { key: "dismissed", label: "Đã bỏ qua", icon: XCircle },
  ] as const;
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(({ key, label, icon: Icon }) => (
        <Card className="gap-0 py-0 shadow-none" key={key}>
          <CardContent className="flex items-center gap-4 p-4">
            <span className="grid size-10 place-items-center rounded-lg bg-muted text-primary">
              <Icon className="size-5" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              {loading ? (
                <Skeleton className="mt-2 h-6 w-12" />
              ) : (
                <p className="mt-1 text-xl font-semibold tabular-nums">{result?.summary[key] ?? 0}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ReportDetailSheet({
  canDelete,
  canManage,
  loading,
  onDeleted,
  onOpenChange,
  onUpdated,
  open,
  report,
}: {
  canDelete: boolean;
  canManage: boolean;
  loading: boolean;
  onDeleted: () => void;
  onOpenChange: (open: boolean) => void;
  onUpdated: (report: AdminLinkReport) => void;
  open: boolean;
  report?: AdminLinkReport;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    if (!report) return;
    setDeleting(true);
    try {
      await deleteAdminLinkReport(report.id);
      toast.success("Đã xoá báo cáo.");
      setDeleteOpen(false);
      onDeleted();
    } catch (failure) {
      toast.error(failure instanceof Error ? failure.message : "Không thể xoá báo cáo.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-xl">
          <SheetHeader className="border-b px-5 py-4 text-left sm:px-6">
            <SheetTitle>Chi tiết báo cáo</SheetTitle>
            <SheetDescription>
              {report?.reference || "Đang tải thông tin..."}
            </SheetDescription>
          </SheetHeader>
          {loading || !report ? (
            <div className="space-y-4 p-5 sm:p-6">
              {Array.from({ length: 7 }).map((_, index) => (
                <Skeleton className="h-14 w-full" key={index} />
              ))}
            </div>
          ) : (
            <div className="space-y-6 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={report.status} />
                <ReasonBadge reason={report.reason} />
              </div>

              <div className="space-y-4 text-sm">
                <DetailItem label="Mã báo cáo" value={report.reference} mono />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Email người gửi</p>
                  <a className="mt-1 inline-flex items-center gap-2 font-medium text-primary hover:underline" href={`mailto:${report.email}`}>
                    <Mail className="size-4" /> {report.email}
                  </a>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">URL được báo cáo</p>
                  <a className="mt-1 flex items-start gap-2 break-all font-medium text-primary hover:underline" href={report.reportedUrl} rel="noreferrer" target="_blank">
                    <ExternalLink className="mt-0.5 size-4 shrink-0" /> {report.reportedUrl}
                  </a>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Nội dung mô tả</p>
                  <p className="mt-2 whitespace-pre-wrap rounded-lg border bg-muted/20 p-4 leading-6">{report.details}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailItem label="Thời gian gửi" value={formatDate(report.createdAt)} />
                  <DetailItem label="Cập nhật" value={formatDate(report.updatedAt)} />
                  <DetailItem label="Người xử lý" value={report.reviewedBy?.name || "Chưa có"} />
                  <DetailItem label="Hoàn tất" value={report.resolvedAt ? formatDate(report.resolvedAt) : "Chưa hoàn tất"} />
                </div>
              </div>

              <Separator />

              {canManage ? (
                <ReportReviewForm
                  key={`${report.id}-${report.updatedAt}`}
                  onUpdated={onUpdated}
                  report={report}
                />
              ) : report.resolutionNote ? (
                <DetailItem label="Ghi chú xử lý" value={report.resolutionNote} />
              ) : null}

              {canDelete ? (
                <div className="border-t pt-5">
                  <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                    <Trash2 /> Xoá báo cáo
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteOpen} onOpenChange={(next) => !deleting && setDeleteOpen(next)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá báo cáo này?</AlertDialogTitle>
            <AlertDialogDescription>
              Báo cáo sẽ được xoá khỏi hàng đợi quản trị. Thao tác này không ảnh hưởng trực tiếp đến liên kết được báo cáo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void remove();
              }}
              variant="destructive"
            >
              {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
              {deleting ? "Đang xoá..." : "Xoá báo cáo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ReportReviewForm({
  onUpdated,
  report,
}: {
  onUpdated: (report: AdminLinkReport) => void;
  report: AdminLinkReport;
}) {
  const [status, setStatus] = useState(report.status);
  const [resolutionNote, setResolutionNote] = useState(report.resolutionNote || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const updated = await updateAdminLinkReport(report.id, {
        status,
        resolutionNote: resolutionNote.trim(),
      });
      onUpdated(updated);
      toast.success("Đã cập nhật báo cáo.");
    } catch (failure) {
      toast.error(failure instanceof Error ? failure.message : "Không thể cập nhật báo cáo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="report-status">Trạng thái xử lý</Label>
        <Select value={status} onValueChange={(value) => setStatus(value as LinkReportStatus)}>
          <SelectTrigger className="w-full" id="report-status"><SelectValue /></SelectTrigger>
          <SelectContent>
            {statusOptions.map((item) => (
              <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="resolution-note">Ghi chú xử lý</Label>
        <Textarea
          id="resolution-note"
          maxLength={2_000}
          onChange={(event) => setResolutionNote(event.target.value)}
          placeholder="Ghi lại kết quả kiểm tra hoặc lý do bỏ qua..."
          rows={5}
          value={resolutionNote}
        />
      </div>
      <Button disabled={saving} onClick={() => void save()}>
        {saving ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
        {saving ? "Đang lưu..." : "Lưu kết quả"}
      </Button>
    </div>
  );
}

function DetailItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-1 break-words ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: LinkReportStatus }) {
  const config = {
    pending: { label: "Chờ xử lý", icon: Clock3, className: "" },
    reviewing: { label: "Đang kiểm tra", icon: CircleDashed, className: "border-primary/30 bg-primary/10 text-primary" },
    resolved: { label: "Đã xử lý", icon: CheckCircle2, className: "border-primary/30 bg-primary/10 text-primary" },
    dismissed: { label: "Đã bỏ qua", icon: XCircle, className: "bg-muted text-muted-foreground" },
  }[status];
  const Icon = config.icon;
  return (
    <Badge className={config.className} variant="outline">
      <Icon /> {config.label}
    </Badge>
  );
}

function ReasonBadge({ reason }: { reason: LinkReportReason }) {
  return (
    <Badge variant="secondary">
      <Flag /> {reasonOptions.find((item) => item.value === reason)?.label || reason}
    </Badge>
  );
}

function ReportTableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton className="h-16 w-full" key={index} />
      ))}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
