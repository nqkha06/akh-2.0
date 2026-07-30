"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarClock, LoaderCircle, Save, Send } from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import { cn } from "@/lib/utils";
import {
  createAdminAnnouncement,
  getAdminAnnouncement,
  publishAdminAnnouncement,
  updateAdminAnnouncement,
} from "../api/announcements.client";
import type {
  AdminAnnouncement,
  AnnouncementDisplay,
  AnnouncementPayload,
  AnnouncementPriority,
  AnnouncementTargetType,
  AnnouncementType,
} from "../types";
import { announcementDisplayLabels, announcementTypeLabels } from "../types";
import { AnnouncementContent, AnnouncementIcon, announcementTone } from "./announcement-ui";

type FormState = {
  title: string;
  slug: string;
  summary: string;
  content: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  displayType: AnnouncementDisplay;
  targetType: AnnouncementTargetType;
  targetValues: string;
  actionLabel: string;
  actionUrl: string;
  startsAt: string;
  endsAt: string;
  isDismissible: boolean;
  requiresAcknowledgement: boolean;
};

const emptyForm: FormState = {
  title: "", slug: "", summary: "", content: "", type: "info", priority: "normal", displayType: "notification", targetType: "all", targetValues: "", actionLabel: "", actionUrl: "", startsAt: "", endsAt: "", isDismissible: true, requiresAcknowledgement: false,
};

function toLocalInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromAnnouncement(item: AdminAnnouncement): FormState {
  return {
    title: item.title,
    slug: item.slug,
    summary: item.summary || "",
    content: item.content,
    type: item.type,
    priority: item.priority,
    displayType: item.displayType,
    targetType: item.targetType,
    targetValues: item.targetType === "users" ? (item.targetRules.userIds || []).join(", ") : item.targetType === "roles" ? (item.targetRules.roles || []).join(", ") : "",
    actionLabel: item.actionLabel || "",
    actionUrl: item.actionUrl || "",
    startsAt: toLocalInput(item.startsAt),
    endsAt: toLocalInput(item.endsAt),
    isDismissible: item.isDismissible,
    requiresAcknowledgement: item.requiresAcknowledgement,
  };
}

function payloadFromForm(form: FormState): AnnouncementPayload {
  const values = form.targetValues.split(",").map((value) => value.trim()).filter(Boolean);
  return {
    title: form.title.trim(),
    slug: form.slug.trim() || undefined,
    summary: form.summary.trim(),
    content: form.content.trim(),
    type: form.type,
    priority: form.priority,
    displayType: form.displayType,
    status: "draft",
    targetType: form.targetType,
    targetRules: form.targetType === "users" ? { userIds: values.map(Number).filter(Number.isInteger) } : form.targetType === "roles" ? { roles: values } : {},
    actionLabel: form.actionLabel.trim(),
    actionUrl: form.actionUrl.trim(),
    startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
    endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
    isDismissible: form.isDismissible,
    requiresAcknowledgement: form.requiresAcknowledgement,
  };
}

export function AnnouncementEditor({ id }: { id?: number }) {
  const router = useRouter();
  const permissions = useAdminPermissions();
  const canPublish = permissions.includes("announcements.publish");
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [record, setRecord] = React.useState<AdminAnnouncement | null>(null);
  const [loading, setLoading] = React.useState(Boolean(id));
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    void getAdminAnnouncement(id).then((item) => { setRecord(item); setForm(fromAnnouncement(item)); }).catch((error) => toast.error(error instanceof Error ? error.message : "Không thể tải thông báo.")).finally(() => setLoading(false));
  }, [id]);

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(publish: boolean) {
    setSaving(true);
    try {
      const saved = id ? await updateAdminAnnouncement(id, payloadFromForm(form)) : await createAdminAnnouncement(payloadFromForm(form));
      if (publish) await publishAdminAnnouncement(saved.id);
      toast.success(publish ? "Đã phát hành thông báo." : id ? "Đã lưu thông báo." : "Đã lưu bản nháp.");
      router.push("/admin/announcements");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu thông báo.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex min-h-80 items-center justify-center"><LoaderCircle className="size-5 animate-spin text-muted-foreground" /></div>;

  return <div className="mx-auto w-full max-w-[1280px] space-y-6 pb-8">
    <AdminPageHeader title={id ? "Chỉnh sửa thông báo" : "Tạo thông báo"} description="Soạn nội dung, chọn vị trí hiển thị, đối tượng và lịch phát hành." actions={<Button variant="outline" onClick={() => router.push("/admin/announcements")}><ArrowLeft />Danh sách</Button>} />
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-5">
        <Card><CardHeader><CardTitle className="text-base">Nội dung</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="grid gap-2"><Label htmlFor="announcement-title">Tiêu đề</Label><Input id="announcement-title" maxLength={160} value={form.title} onChange={(event) => patch("title", event.target.value)} placeholder="Hệ thống bảo trì định kỳ" /></div>
          <div className="grid gap-2"><Label htmlFor="announcement-slug">Slug</Label><Input id="announcement-slug" value={form.slug} onChange={(event) => patch("slug", event.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-+/, ""))} placeholder="Để trống để tự tạo" /></div>
          <div className="grid gap-2"><Label htmlFor="announcement-summary">Mô tả ngắn</Label><Textarea id="announcement-summary" rows={2} maxLength={300} value={form.summary} onChange={(event) => patch("summary", event.target.value)} /></div>
          <div className="grid gap-2"><Label htmlFor="announcement-content">Nội dung chi tiết</Label><Textarea id="announcement-content" rows={10} maxLength={20_000} value={form.content} onChange={(event) => patch("content", event.target.value)} placeholder={"Dùng **chữ đậm**, danh sách bắt đầu bằng - và [liên kết](https://example.com)."} /><p className="text-xs text-muted-foreground">Hỗ trợ đoạn văn, xuống dòng, danh sách, link và chữ đậm. HTML tự do bị chặn.</p></div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Phân loại và hiển thị</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2"><Label>Loại</Label><Select value={form.type} onValueChange={(value) => patch("type", value as AnnouncementType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(announcementTypeLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid gap-2"><Label>Ưu tiên</Label><Select value={form.priority} onValueChange={(value) => patch("priority", value as AnnouncementPriority)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Thấp</SelectItem><SelectItem value="normal">Bình thường</SelectItem><SelectItem value="high">Cao</SelectItem><SelectItem value="critical">Khẩn cấp</SelectItem></SelectContent></Select></div>
          <div className="grid gap-2"><Label>Kiểu hiển thị</Label><Select value={form.displayType} onValueChange={(value) => patch("displayType", value as AnnouncementDisplay)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(announcementDisplayLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Đối tượng và lịch</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label>Đối tượng nhận</Label><Select value={form.targetType} onValueChange={(value) => { patch("targetType", value as AnnouncementTargetType); patch("targetValues", ""); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả người dùng</SelectItem><SelectItem value="users">Người dùng cụ thể</SelectItem><SelectItem value="roles">Theo role</SelectItem></SelectContent></Select></div>{form.targetType !== "all" ? <div className="grid gap-2"><Label>{form.targetType === "users" ? "User ID" : "Role key"}</Label><Input value={form.targetValues} onChange={(event) => patch("targetValues", event.target.value)} placeholder={form.targetType === "users" ? "12, 18, 35" : "member, admin"} /><p className="text-xs text-muted-foreground">Phân tách nhiều giá trị bằng dấu phẩy.</p></div> : null}</div>
          <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="starts-at">Bắt đầu</Label><Input id="starts-at" type="datetime-local" value={form.startsAt} onChange={(event) => patch("startsAt", event.target.value)} /></div><div className="grid gap-2"><Label htmlFor="ends-at">Kết thúc</Label><Input id="ends-at" type="datetime-local" value={form.endsAt} onChange={(event) => patch("endsAt", event.target.value)} /></div></div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Hành động và tương tác</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label>Nhãn nút</Label><Input value={form.actionLabel} onChange={(event) => patch("actionLabel", event.target.value)} placeholder="Xem chi tiết" /></div><div className="grid gap-2"><Label>URL hành động</Label><Input value={form.actionUrl} onChange={(event) => patch("actionUrl", event.target.value)} placeholder="/member/account hoặc https://..." /></div></div>
          <label className="flex items-center justify-between gap-4 rounded-lg border px-3 py-3"><span><span className="block text-sm font-medium">Cho phép đóng</span><span className="text-xs text-muted-foreground">Member có thể ẩn banner hoặc modal.</span></span><Switch checked={form.isDismissible} onCheckedChange={(checked) => patch("isDismissible", checked)} /></label>
          <label className="flex items-center justify-between gap-4 rounded-lg border px-3 py-3"><span><span className="block text-sm font-medium">Bắt buộc xác nhận</span><span className="text-xs text-muted-foreground">Phù hợp với modal quan trọng.</span></span><Switch checked={form.requiresAcknowledgement} onCheckedChange={(checked) => patch("requiresAcknowledgement", checked)} /></label>
        </CardContent></Card>
      </div>
      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <Card><CardHeader><CardTitle className="text-base">Xem trước</CardTitle></CardHeader><CardContent><div className={cn("rounded-xl border p-4", announcementTone(form.type))}><div className="flex items-start gap-3"><AnnouncementIcon type={form.type} className="mt-0.5 size-5 shrink-0" /><div className="min-w-0"><p className="font-semibold text-foreground">{form.title || "Tiêu đề thông báo"}</p>{form.summary ? <p className="mt-1 text-sm text-muted-foreground">{form.summary}</p> : null}</div></div>{form.content ? <div className="mt-4 border-t border-current/10 pt-4"><AnnouncementContent content={form.content} /></div> : null}</div></CardContent></Card>
        <Card><CardContent className="space-y-3 pt-6"><div className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarClock className="size-4" />{form.startsAt ? "Sẽ tự kích hoạt theo lịch." : "Kích hoạt ngay khi phát hành."}</div><Button className="w-full" variant="outline" disabled={saving || !form.title.trim() || !form.content.trim()} onClick={() => void save(false)}>{saving ? <LoaderCircle className="animate-spin" /> : <Save />}Lưu bản nháp</Button>{canPublish ? <Button className="w-full" disabled={saving || !form.title.trim() || !form.content.trim()} onClick={() => void save(true)}><Send />{record?.status === "active" ? "Lưu và cập nhật" : "Lưu và phát hành"}</Button> : null}</CardContent></Card>
      </aside>
    </div>
  </div>;
}
