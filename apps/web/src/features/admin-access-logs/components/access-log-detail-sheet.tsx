"use client";

import {
  Activity,
  AlertTriangle,
  Bot,
  CircleDollarSign,
  LoaderCircle,
  Network,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";

import {
  getAdminAccessLog,
  reviewAdminAccessLog,
} from "../api/access-logs.client";
import type {
  AccessLogReviewStatus,
  AdminAccessLog,
  AdminAccessLogDetail,
} from "../types";
import {
  DetectionBadge,
  formatMoney,
  ReviewBadge,
} from "./access-logs-table-columns";

export function AccessLogDetailSheet({
  log,
  onOpenChange,
}: {
  log: AdminAccessLog;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const canReview = useAdminPermissions().includes("stu_access_logs.review");
  const [detail, setDetail] = React.useState<AdminAccessLogDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [reviewStatus, setReviewStatus] = React.useState<AccessLogReviewStatus>(
    log.review?.status || "safe",
  );
  const [note, setNote] = React.useState(log.review?.note || "");

  React.useEffect(() => {
    let active = true;
    void getAdminAccessLog(log.id)
      .then((result) => {
        if (!active) return;
        setDetail(result);
        setReviewStatus(result.review?.status || "safe");
        setNote(result.review?.note || "");
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : "Không thể tải chi tiết.",
          );
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [log.id]);

  async function saveReview() {
    setSaving(true);
    try {
      const updated = await reviewAdminAccessLog(log.id, {
        status: reviewStatus,
        note,
      });
      setDetail(updated);
      toast.success("Đã lưu kết quả review.");
      router.refresh();
    } catch (reason) {
      toast.error(
        reason instanceof Error ? reason.message : "Không thể lưu review.",
      );
    } finally {
      setSaving(false);
    }
  }

  const item = detail || log;
  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader className="border-b p-6">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="min-w-0">
              <SheetTitle>Access log</SheetTitle>
              <SheetDescription className="truncate font-mono text-xs">
                {log.id}
              </SheetDescription>
            </div>
            <DetectionBadge log={item} />
          </div>
        </SheetHeader>
        <div className="space-y-6 px-6 pb-8">
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" /> Đang tải thống kê
              liên quan...
            </p>
          ) : null}
          {error ? (
            <Alert variant="destructive">
              <AlertTriangle />
              <AlertTitle>Không thể tải đầy đủ chi tiết</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <section className="grid gap-3 sm:grid-cols-2">
            <InfoCard icon={UserRound} label="User">
              <Link href={`/admin/users/${item.user.id}`} className="font-medium hover:underline">
                {item.user.name}
              </Link>
              <p className="truncate text-xs text-muted-foreground">{item.user.email}</p>
            </InfoCard>
            <InfoCard icon={Activity} label="Link">
              <p className="font-medium">{item.link.title}</p>
              <p className="truncate text-xs text-muted-foreground">#{item.link.id} · /{item.link.slug}</p>
            </InfoCard>
          </section>

          <section>
            <h3 className="text-sm font-medium">Dữ liệu request</h3>
            <dl className="mt-3 divide-y rounded-xl border px-4 text-sm">
              <DetailRow label="Thời gian" value={formatTimestamp(item.createdAt)} />
              <DetailRow label="IP address" value={item.ipAddress || "—"} mono />
              <DetailRow label="Quốc gia" value={item.country || "ZZ"} />
              <DetailRow label="Thiết bị" value={item.deviceLabel} />
              {detail ? <>
                <DetailRow label="Monetization level" value={detail.level?.name || "Không có"} />
                <DetailRow label="Agent hash" value={detail.agentHash} mono />
                <DetailRow label="User-Agent" value={detail.userAgent.raw} />
                <DetailRow label="Browser / OS" value={`${detail.userAgent.browser} / ${detail.userAgent.os}`} />
                <DetailRow label="Referrer" value={detail.referrer || "—"} />
              </> : null}
            </dl>
          </section>

          <section>
            <h3 className="flex items-center gap-2 text-sm font-medium"><CircleDollarSign className="size-4" /> Kết quả xử lý</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Metric label="Revenue" value={formatMoney(item.revenue)} />
              <Metric label="is_earn" value={item.isEarn ? "Có" : "Không"} />
              <Metric label="Payout CPM" value={detail ? formatMoney(detail.payoutCpm) : "—"} />
            </div>
            <dl className="mt-3 divide-y rounded-xl border px-4 text-sm">
              <DetailRow label="Detection mask" value={`${item.detectionMask}${item.detectionReasons.length ? ` · ${item.detectionReasons.join(", ")}` : ""}`} />
              <DetailRow label="Reject reason mask" value={`${item.rejectReasonMask}${item.rejectReasons.length ? ` · ${item.rejectReasons.join(", ")}` : ""}`} />
              <DetailRow label="Completed at" value={item.completedAt ? formatTimestamp(item.completedAt) : "Chưa hoàn tất"} />
              <DetailRow label="Processed at" value={item.processedAt ? formatTimestamp(item.processedAt) : "Chưa xử lý"} />
            </dl>
          </section>

          {detail ? (
            <section>
              <h3 className="flex items-center gap-2 text-sm font-medium"><Network className="size-4" /> Tín hiệu liên quan tại thời điểm log</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Metric label="Cùng IP / 1 giờ" value={detail.related.sameIp1h} />
                <Metric label="Cùng IP / 24 giờ" value={detail.related.sameIp24h} />
                <Metric label="Chủ link cùng IP" value={detail.related.distinctLinkOwnerCount} />
                <Metric label="Cùng agent / 24 giờ" value={detail.related.sameAgent24h} />
                <Metric label="Link cùng IP" value={detail.related.links.length} />
                <Metric label="Revenue IP / 24 giờ" value={formatMoney(detail.related.ipRevenue24h)} />
              </div>
              <Button variant="outline" className="mt-3" asChild>
                <Link href={`/admin/users/${item.user.id}/access-analysis`}>
                  <Bot /> Phân tích user on-demand
                </Link>
              </Button>
            </section>
          ) : null}

          <section className="rounded-xl border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium">Review của Admin</h3>
                <p className="mt-1 text-xs text-muted-foreground">Review được lưu riêng; không thay đổi access log hoặc doanh thu.</p>
              </div>
              <ReviewBadge status={item.review?.status} />
            </div>
            {canReview ? (
              <div className="mt-4 space-y-3">
                <div className="space-y-1.5"><Label>Trạng thái</Label><Select value={reviewStatus} onValueChange={(value) => setReviewStatus(value as AccessLogReviewStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="safe">An toàn</SelectItem><SelectItem value="suspicious">Đáng ngờ</SelectItem><SelectItem value="follow_up">Theo dõi thêm</SelectItem></SelectContent></Select></div>
                <div className="space-y-1.5"><Label>Ghi chú</Label><Textarea value={note} maxLength={1000} onChange={(event) => setNote(event.target.value)} placeholder="Evidence hoặc lý do kết luận..." /></div>
                <Button disabled={saving} onClick={() => void saveReview()}>{saving ? "Đang lưu..." : "Lưu review"}</Button>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Bạn không có quyền cập nhật review.</p>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function InfoCard({ icon: Icon, label, children }: { icon: typeof UserRound; label: string; children: React.ReactNode }) {
  return <div className="rounded-xl border bg-muted/20 p-4"><p className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="size-4" /> {label}</p><div className="mt-2">{children}</div></div>;
}
function Metric({ label, value }: { label: string; value: React.ReactNode }) { return <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold tabular-nums">{value}</p></div>; }
function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) { return <div className="grid grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] gap-4 py-3"><dt className="text-muted-foreground">{label}</dt><dd className={`break-all text-right font-medium ${mono ? "font-mono text-xs" : ""}`}>{value}</dd></div>; }
function formatTimestamp(value: string) { return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "medium" }).format(new Date(value)); }
