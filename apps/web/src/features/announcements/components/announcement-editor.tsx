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
import { getAdminLanguages } from "@/features/languages/api/languages.client";
import type { Language } from "@/features/languages/types";
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
  slug: string;
  translations: Record<string, TranslationForm>;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  displayType: AnnouncementDisplay;
  targetType: AnnouncementTargetType;
  targetValues: string;
  actionUrl: string;
  startsAt: string;
  endsAt: string;
  isDismissible: boolean;
  requiresAcknowledgement: boolean;
};

type TranslationForm = {
  title: string;
  summary: string;
  content: string;
  actionLabel: string;
};

const emptyTranslation: TranslationForm = { title: "", summary: "", content: "", actionLabel: "" };

const fallbackLanguages: Language[] = [
  { id: -1, name: "Vietnamese", nativeName: "Tiếng Việt", locale: "vi", code: "vi", regional: "vi-VN", flag: "VN", isDefault: true, status: "published", sortOrder: 10, isRtl: false },
  { id: -2, name: "English", nativeName: "English", locale: "en", code: "en", regional: "en-US", flag: "US", isDefault: false, status: "published", sortOrder: 20, isRtl: false },
];

const emptyForm: FormState = {
  slug: "", translations: { vi: { ...emptyTranslation } }, type: "info", priority: "normal", displayType: "notification", targetType: "all", targetValues: "", actionUrl: "", startsAt: "", endsAt: "", isDismissible: true, requiresAcknowledgement: false,
};

function toLocalInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromAnnouncement(item: AdminAnnouncement): FormState {
  return {
    slug: item.slug,
    translations: Object.fromEntries(item.translations.map((translation) => [translation.locale, {
      title: translation.title,
      summary: translation.summary || "",
      content: translation.content,
      actionLabel: translation.actionLabel || "",
    }])),
    type: item.type,
    priority: item.priority,
    displayType: item.displayType,
    targetType: item.targetType,
    targetValues: item.targetType === "users" ? (item.targetRules.userIds || []).join(", ") : item.targetType === "roles" ? (item.targetRules.roles || []).join(", ") : "",
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
    translations: Object.entries(form.translations)
      .filter(([, translation]) => Boolean(translation.title.trim() || translation.summary.trim() || translation.content.trim() || translation.actionLabel.trim()))
      .map(([locale, translation]) => ({
        locale,
        title: translation.title.trim(),
        summary: translation.summary.trim(),
        content: translation.content.trim(),
        actionLabel: translation.actionLabel.trim(),
      })),
    slug: form.slug.trim() || undefined,
    type: form.type,
    priority: form.priority,
    displayType: form.displayType,
    status: "draft",
    targetType: form.targetType,
    targetRules: form.targetType === "users" ? { userIds: values.map(Number).filter(Number.isInteger) } : form.targetType === "roles" ? { roles: values } : {},
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
  const [languages, setLanguages] = React.useState<Language[]>(fallbackLanguages);
  const [activeLocale, setActiveLocale] = React.useState("vi");

  const defaultLocale = languages.find((language) => language.isDefault)?.locale || "vi";
  const translation = form.translations[activeLocale] || emptyTranslation;
  const defaultTranslation = form.translations[defaultLocale] || emptyTranslation;

  React.useEffect(() => {
    if (!id) return;
    void getAdminAnnouncement(id).then((item) => { setRecord(item); setForm(fromAnnouncement(item)); }).catch((error) => toast.error(error instanceof Error ? error.message : "Không thể tải thông báo.")).finally(() => setLoading(false));
  }, [id]);

  React.useEffect(() => {
    let active = true;
    void getAdminLanguages().then((result) => {
      if (!active) return;
      const visible = result.items.filter((language) => language.status === "published" || language.isDefault);
      if (!visible.length) return;
      setLanguages(visible);
      setActiveLocale((current) => visible.some((language) => language.locale === current) ? current : (visible.find((language) => language.isDefault)?.locale || visible[0].locale));
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function patchTranslation<K extends keyof TranslationForm>(key: K, value: TranslationForm[K]) {
    setForm((current) => ({
      ...current,
      translations: {
        ...current.translations,
        [activeLocale]: { ...(current.translations[activeLocale] || emptyTranslation), [key]: value },
      },
    }));
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
        <Card><CardHeader><CardTitle className="text-base">Nội dung theo ngôn ngữ</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="grid gap-2"><Label>Ngôn ngữ</Label><Select value={activeLocale} onValueChange={setActiveLocale}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{languages.map((language) => <SelectItem key={language.locale} value={language.locale}>{language.nativeName || language.name}{language.isDefault ? " (mặc định)" : ""}</SelectItem>)}</SelectContent></Select><p className="text-xs text-muted-foreground">Bản dịch locale mặc định là bắt buộc. Các locale khác sẽ fallback về bản mặc định nếu để trống.</p></div>
          <div className="grid gap-2"><Label htmlFor="announcement-title">Tiêu đề</Label><Input id="announcement-title" maxLength={160} value={translation.title} onChange={(event) => patchTranslation("title", event.target.value)} placeholder="Hệ thống bảo trì định kỳ" /></div>
          <div className="grid gap-2"><Label htmlFor="announcement-slug">Slug</Label><Input id="announcement-slug" value={form.slug} onChange={(event) => patch("slug", event.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-+/, ""))} placeholder="Để trống để tự tạo" /></div>
          <div className="grid gap-2"><Label htmlFor="announcement-summary">Mô tả ngắn</Label><Textarea id="announcement-summary" rows={2} maxLength={300} value={translation.summary} onChange={(event) => patchTranslation("summary", event.target.value)} /></div>
          <div className="grid gap-2"><Label htmlFor="announcement-content">Nội dung chi tiết</Label><Textarea id="announcement-content" rows={10} maxLength={20_000} value={translation.content} onChange={(event) => patchTranslation("content", event.target.value)} placeholder={"Dùng **chữ đậm**, danh sách bắt đầu bằng - và [liên kết](https://example.com)."} /><p className="text-xs text-muted-foreground">Hỗ trợ đoạn văn, xuống dòng, danh sách, link và chữ đậm. HTML tự do bị chặn.</p></div>
          <div className="grid gap-2"><Label>Nhãn nút</Label><Input value={translation.actionLabel} onChange={(event) => patchTranslation("actionLabel", event.target.value)} placeholder="Xem chi tiết" /></div>
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
          <div className="grid gap-2"><Label>URL hành động</Label><Input value={form.actionUrl} onChange={(event) => patch("actionUrl", event.target.value)} placeholder="/member/account hoặc https://..." /><p className="text-xs text-muted-foreground">URL dùng chung; nhãn nút được dịch riêng theo từng locale.</p></div>
          <label className="flex items-center justify-between gap-4 rounded-lg border px-3 py-3"><span><span className="block text-sm font-medium">Cho phép đóng</span><span className="text-xs text-muted-foreground">Member có thể ẩn banner hoặc modal.</span></span><Switch checked={form.isDismissible} onCheckedChange={(checked) => patch("isDismissible", checked)} /></label>
          <label className="flex items-center justify-between gap-4 rounded-lg border px-3 py-3"><span><span className="block text-sm font-medium">Bắt buộc xác nhận</span><span className="text-xs text-muted-foreground">Phù hợp với modal quan trọng.</span></span><Switch checked={form.requiresAcknowledgement} onCheckedChange={(checked) => patch("requiresAcknowledgement", checked)} /></label>
        </CardContent></Card>
      </div>
      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <Card><CardHeader><CardTitle className="text-base">Xem trước ({activeLocale})</CardTitle></CardHeader><CardContent><div className={cn("rounded-xl border p-4", announcementTone(form.type))}><div className="flex items-start gap-3"><AnnouncementIcon type={form.type} className="mt-0.5 size-5 shrink-0" /><div className="min-w-0"><p className="font-semibold text-foreground">{translation.title || "Tiêu đề thông báo"}</p>{translation.summary ? <p className="mt-1 text-sm text-muted-foreground">{translation.summary}</p> : null}</div></div>{translation.content ? <div className="mt-4 border-t border-current/10 pt-4"><AnnouncementContent content={translation.content} /></div> : null}</div></CardContent></Card>
        <Card><CardContent className="space-y-3 pt-6"><div className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarClock className="size-4" />{form.startsAt ? "Sẽ tự kích hoạt theo lịch." : "Kích hoạt ngay khi phát hành."}</div><Button className="w-full" variant="outline" disabled={saving || !defaultTranslation.title.trim() || !defaultTranslation.content.trim()} onClick={() => void save(false)}>{saving ? <LoaderCircle className="animate-spin" /> : <Save />}Lưu bản nháp</Button>{canPublish ? <Button className="w-full" disabled={saving || !defaultTranslation.title.trim() || !defaultTranslation.content.trim()} onClick={() => void save(true)}><Send />{record?.status === "active" ? "Lưu và cập nhật" : "Lưu và phát hành"}</Button> : null}</CardContent></Card>
      </aside>
    </div>
  </div>;
}
