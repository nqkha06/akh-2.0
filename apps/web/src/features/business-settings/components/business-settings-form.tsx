"use client";
/* eslint-disable @next/next/no-img-element */

import type { BackgroundImagePreset, BackgroundVideoPreset } from "@stu/contracts";
import {
  Banknote,
  CircleDollarSign,
  FileUp,
  ImageIcon,
  Loader2,
  LockKeyhole,
  Plus,
  Save,
  Settings2,
  ShieldAlert,
  Trash2,
  Video,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { updateBusinessSettings } from "../api/business-settings.client";
import type { AdminBusinessSettings } from "../types";
import { clearBusinessConfigCache } from "../use-business-config";

const MB = 1024 * 1024;

export function BusinessSettingsForm({
  initialSettings,
  canUpdate,
}: {
  initialSettings: AdminBusinessSettings;
  canUpdate: boolean;
}) {
  const [saved, setSaved] = React.useState(initialSettings);
  const [settings, setSettings] = React.useState(initialSettings);
  const [saving, setSaving] = React.useState(false);
  const dirty = JSON.stringify(settings) !== JSON.stringify(saved);
  const activeCurrencies = settings.currencies.filter((currency) => currency.isActive);
  const displayCurrency = settings.currencies.find((currency) => currency.isDefault);

  React.useEffect(() => {
    const protect = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    const protectNavigation = (event: MouseEvent) => {
      if (!dirty) return;
      const anchor = event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>("a[href]")
        : null;
      if (!anchor || anchor.target === "_blank") return;
      const destination = new URL(anchor.href, window.location.href);
      if (
        destination.origin === window.location.origin &&
        destination.pathname === window.location.pathname
      ) return;
      if (!window.confirm("Bạn có thay đổi chưa lưu. Vẫn rời khỏi trang?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", protect);
    document.addEventListener("click", protectNavigation, true);
    return () => {
      window.removeEventListener("beforeunload", protect);
      document.removeEventListener("click", protectNavigation, true);
    };
  }, [dirty]);

  function patch(values: Partial<AdminBusinessSettings>) {
    setSettings((current) => ({ ...current, ...values }));
  }

  async function save() {
    if (
      settings.baseCurrencyCode !== saved.baseCurrencyCode &&
      !window.confirm(
        "Đổi tiền hạch toán sẽ quy đổi lại tỷ giá và mức phí rút. Thao tác bị chặn nếu đã có dữ liệu tài chính. Tiếp tục?",
      )
    ) return;
    const payload = {
      version: settings.version,
      registrationEnabled: settings.registrationEnabled,
      emailVerificationRequired: settings.emailVerificationRequired,
      googleLoginEnabled: settings.googleLoginEnabled,
      baseCurrencyCode: settings.baseCurrencyCode,
      withdrawalCurrencyCode: settings.withdrawalCurrencyCode,
      referralCommissionRate: settings.referralCommissionRate,
      loyaltyWindowDays: settings.loyaltyWindowDays,
      loyaltyHistoryDays: settings.loyaltyHistoryDays,
      memberFileMaxBytes: settings.memberFileMaxBytes,
      coverImageMaxBytes: settings.coverImageMaxBytes,
      adminMediaMaxBytes: settings.adminMediaMaxBytes,
      supportAttachmentMaxBytes: settings.supportAttachmentMaxBytes,
      memberStorageQuotaBytes: settings.memberStorageQuotaBytes,
      uploadAllowedMimeTypes: settings.uploadAllowedMimeTypes,
      backgroundImages: settings.backgroundImages,
      backgroundVideos: settings.backgroundVideos,
      maintenanceMode: settings.maintenanceMode,
      withdrawalsPaused: settings.withdrawalsPaused,
    };
    try {
      setSaving(true);
      const updated = await updateBusinessSettings(payload);
      clearBusinessConfigCache();
      setSettings(updated);
      setSaved(updated);
      toast.success("Đã lưu Business settings.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu cấu hình.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Version {settings.version}</Badge>
            <Badge variant={dirty ? "secondary" : "outline"}>{dirty ? "Có thay đổi chưa lưu" : "Đã đồng bộ"}</Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Cập nhật gần nhất {new Date(settings.updatedAt).toLocaleString("vi-VN")}. API dùng optimistic locking để chống ghi đè.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={!dirty || saving} onClick={() => setSettings(saved)}>Hoàn tác</Button>
          <Button type="button" disabled={!canUpdate || !dirty || saving} onClick={() => void save()}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />} Lưu thay đổi
          </Button>
        </div>
      </div>

      {!canUpdate ? (
        <Alert><LockKeyhole /><AlertTitle>Chỉ có quyền xem</AlertTitle><AlertDescription>Bạn cần quyền settings.update để thay đổi cấu hình.</AlertDescription></Alert>
      ) : null}

      <Tabs defaultValue="monetization" className="gap-5">
        <div className="overflow-x-auto border-b">
          <TabsList variant="line" className="min-w-max">
            <TabsTrigger value="authentication"><LockKeyhole />Xác thực</TabsTrigger>
            <TabsTrigger value="monetization"><CircleDollarSign />Kiếm tiền</TabsTrigger>
            <TabsTrigger value="uploads"><FileUp />Upload</TabsTrigger>
            <TabsTrigger value="operations"><ShieldAlert />Vận hành</TabsTrigger>
            <TabsTrigger value="presets"><ImageIcon />Preset</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="authentication">
          <SettingsCard title="Đăng nhập & tài khoản" description="Các công tắc được API kiểm tra, không chỉ ẩn nút trên giao diện.">
            <SettingSwitch label="Cho phép đăng ký" description="Tắt để ngăn tạo tài khoản bằng email." checked={settings.registrationEnabled} onCheckedChange={(value) => patch({ registrationEnabled: value })} />
            <SettingSwitch label="Bắt buộc xác minh email" description="Chính sách cho tài khoản đăng ký bằng email." checked={settings.emailVerificationRequired} onCheckedChange={(value) => patch({ emailVerificationRequired: value })} />
            <SettingSwitch label="Google login" description="Tắt để từ chối đăng nhập và đăng ký mới qua Google OAuth." checked={settings.googleLoginEnabled} onCheckedChange={(value) => patch({ googleLoginEnabled: value })} />
            <Alert>
              <Settings2 /><AlertTitle>Phạm vi ngôn ngữ</AlertTitle>
              <AlertDescription>Locale đã publish trong Languages sẽ xuất hiện cho member. {settings.uiLanguages.bundled.join(", ")} có bundle đầy đủ; locale mới fallback sang {settings.uiLanguages.fallbackLocale} cho đến khi admin dịch đủ key.</AlertDescription>
            </Alert>
          </SettingsCard>
        </TabsContent>

        <TabsContent value="monetization" className="space-y-5">
          <Alert>
            <Banknote /><AlertTitle>Ba vai trò tiền tệ độc lập</AlertTitle>
            <AlertDescription>
              <p>
                Tiền hạch toán lưu số dư nội bộ; tiền hiển thị mặc định hiện là <strong>{displayCurrency?.code ?? "—"}</strong>; tiền rút là đồng tiền dùng trên form và snapshot giao dịch. <Link href="/admin/settings/currencies" className="font-medium underline underline-offset-4">Quản lý tiền hiển thị và tỷ giá</Link>.
              </p>
            </AlertDescription>
          </Alert>
          <div className="grid gap-5 lg:grid-cols-2">
            <SettingsCard title="Tiền tệ" description="Tiền hạch toán là thay đổi cấp hệ thống và được bảo vệ chặt.">
              <SelectField label="Tiền hạch toán (base)" value={settings.baseCurrencyCode} options={activeCurrencies} onChange={(value) => patch({ baseCurrencyCode: value })} />
              <SelectField label="Tiền thanh toán rút" value={settings.withdrawalCurrencyCode} options={activeCurrencies} onChange={(value) => patch({ withdrawalCurrencyCode: value })} />
            </SettingsCard>
            <SettingsCard title="Hoa hồng & loyalty" description="Thay đổi áp dụng cho giao dịch và kỳ tính tiếp theo.">
              <NumberField label="Hoa hồng giới thiệu (%)" value={Number(settings.referralCommissionRate)} min={0} max={100} step={0.01} onChange={(value) => patch({ referralCommissionRate: value.toFixed(2) })} />
              <NumberField label="Cửa sổ loyalty (ngày)" value={settings.loyaltyWindowDays} min={1} max={365} onChange={(value) => patch({ loyaltyWindowDays: value })} />
              <NumberField label="Lịch sử loyalty (ngày)" value={settings.loyaltyHistoryDays} min={1} max={365} onChange={(value) => patch({ loyaltyHistoryDays: value })} />
            </SettingsCard>
          </div>
        </TabsContent>

        <TabsContent value="uploads" className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <SettingsCard title="Giới hạn dung lượng" description="Đơn vị MB. Backend luôn kiểm tra lại, không tin giới hạn từ client.">
              <MegabyteField label="File thành viên" bytes={settings.memberFileMaxBytes} max={1024} onChange={(value) => patch({ memberFileMaxBytes: value })} />
              <MegabyteField label="Ảnh cover" bytes={settings.coverImageMaxBytes} max={100} onChange={(value) => patch({ coverImageMaxBytes: value })} />
              <MegabyteField label="Media admin" bytes={settings.adminMediaMaxBytes} max={100} onChange={(value) => patch({ adminMediaMaxBytes: value })} />
              <MegabyteField label="File hỗ trợ" bytes={settings.supportAttachmentMaxBytes} max={100} onChange={(value) => patch({ supportAttachmentMaxBytes: value })} />
              <MegabyteField label="Quota mặc định mỗi thành viên" bytes={settings.memberStorageQuotaBytes} max={1_048_576} onChange={(value) => patch({ memberStorageQuotaBytes: value })} />
            </SettingsCard>
            <SettingsCard title="MIME types được phép" description="Mỗi dòng một MIME type; áp dụng cho upload file thành viên.">
              <Textarea
                rows={12}
                value={settings.uploadAllowedMimeTypes.join("\n")}
                onChange={(event) => patch({ uploadAllowedMimeTypes: event.target.value.split(/\s+/).map((item) => item.trim()).filter(Boolean) })}
                spellCheck={false}
                className="font-mono text-xs"
              />
            </SettingsCard>
          </div>
        </TabsContent>

        <TabsContent value="operations">
          <SettingsCard title="Kiểm soát vận hành" description="Dùng khi bảo trì hoặc cần dừng riêng luồng thanh toán.">
            <SettingSwitch tone="danger" label="Maintenance mode" description="Chặn đăng ký và các thao tác ghi của thành viên; admin vẫn quản trị được." checked={settings.maintenanceMode} onCheckedChange={(value) => patch({ maintenanceMode: value })} />
            <SettingSwitch tone="danger" label="Tạm dừng rút tiền" description="Chặn yêu cầu rút mới nhưng vẫn cho phép xem lịch sử." checked={settings.withdrawalsPaused} onCheckedChange={(value) => patch({ withdrawalsPaused: value })} />
          </SettingsCard>
        </TabsContent>

        <TabsContent value="presets" className="space-y-5">
          <PresetImages items={settings.backgroundImages} onChange={(backgroundImages) => patch({ backgroundImages })} />
          <PresetVideos items={settings.backgroundVideos} onChange={(backgroundVideos) => patch({ backgroundVideos })} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SettingsCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent className="space-y-5">{children}</CardContent></Card>;
}

function SettingSwitch({ label, description, checked, onCheckedChange, tone }: { label: string; description: string; checked: boolean; onCheckedChange: (value: boolean) => void; tone?: "danger" }) {
  return <div className={`flex items-start justify-between gap-5 rounded-lg border p-4 ${tone === "danger" && checked ? "border-destructive/40 bg-destructive/5" : "bg-muted/10"}`}><div><Label className="text-sm font-medium">{label}</Label><p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p></div><Switch checked={checked} onCheckedChange={onCheckedChange} /></div>;
}

function NumberField({ label, value, onChange, min, max, step = 1 }: { label: string; value: number; onChange: (value: number) => void; min: number; max: number; step?: number }) {
  return <div className="space-y-2"><Label>{label}</Label><Input type="number" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} /></div>;
}

function MegabyteField({ label, bytes, max, onChange }: { label: string; bytes: number; max: number; onChange: (bytes: number) => void }) {
  return <NumberField label={label} value={bytes / MB} min={1} max={max} onChange={(value) => onChange(Math.round(value * MB))} />;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: AdminBusinessSettings["currencies"]; onChange: (value: string) => void }) {
  return <div className="space-y-2"><Label>{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{options.map((currency) => <SelectItem key={currency.code} value={currency.code}>{currency.code} — {currency.name} ({currency.symbol})</SelectItem>)}</SelectContent></Select></div>;
}

function PresetImages({ items, onChange }: { items: BackgroundImagePreset[]; onChange: (items: BackgroundImagePreset[]) => void }) {
  const update = (index: number, values: Partial<BackgroundImagePreset>) => onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...values } : item));
  return <SettingsCard title={`Ảnh nền (${items.length})`} description="Thư viện được tải từ API và dùng chung trong link creator.">
    <div className="grid gap-3 md:grid-cols-2">{items.map((item, index) => <div key={`${item.id}-${index}`} className="grid gap-3 rounded-lg border p-3 sm:flex"><img src={item.imageUrl} alt="" className="h-32 w-full shrink-0 rounded-md bg-muted object-cover sm:size-20" /><div className="min-w-0 flex-1 space-y-2"><div className="flex items-center gap-2"><Input value={item.name} aria-label="Tên ảnh" onChange={(event) => update(index, { name: event.target.value })} /><Switch checked={item.enabled} onCheckedChange={(enabled) => update(index, { enabled })} /><Button type="button" size="icon" variant="ghost" className="shrink-0" aria-label="Xóa ảnh" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 /></Button></div><Input value={item.imageUrl} aria-label="URL ảnh" onChange={(event) => update(index, { imageUrl: event.target.value })} className="text-xs" /><Input value={item.categories.join(", ")} aria-label="Danh mục ảnh" onChange={(event) => update(index, { categories: splitCategories(event.target.value) })} className="text-xs" /></div></div>)}</div>
    <Button type="button" variant="outline" onClick={() => onChange([...items, { id: crypto.randomUUID(), name: "Preset mới", imageUrl: "https://", categories: ["Khác"], enabled: false }])}><Plus />Thêm ảnh</Button>
  </SettingsCard>;
}

function PresetVideos({ items, onChange }: { items: BackgroundVideoPreset[]; onChange: (items: BackgroundVideoPreset[]) => void }) {
  const update = (index: number, values: Partial<BackgroundVideoPreset>) => onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...values } : item));
  return <SettingsCard title={`Video nền (${items.length})`} description="Không còn danh sách Coverr trùng lặp giữa các component.">
    <div className="grid gap-3 md:grid-cols-2">{items.map((item, index) => <div key={`${item.id}-${index}`} className="rounded-lg border p-3"><div className="mb-3 flex items-center gap-2"><span className="grid size-9 place-items-center rounded-md bg-muted"><Video className="size-4" /></span><Input value={item.name} aria-label="Tên video" onChange={(event) => update(index, { name: event.target.value })} /><Switch checked={item.enabled} onCheckedChange={(enabled) => update(index, { enabled })} /><Button type="button" size="icon" variant="ghost" aria-label="Xóa video" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 /></Button></div><div className="space-y-2"><Input value={item.videoUrl} aria-label="URL video" onChange={(event) => update(index, { videoUrl: event.target.value })} className="text-xs" /><div className="grid grid-cols-2 gap-2"><Input value={item.source} aria-label="Nguồn video" onChange={(event) => update(index, { source: event.target.value })} /><Input value={item.sourceUrl} aria-label="URL nguồn" onChange={(event) => update(index, { sourceUrl: event.target.value })} /></div><Input value={item.categories.join(", ")} aria-label="Danh mục video" onChange={(event) => update(index, { categories: splitCategories(event.target.value) })} className="text-xs" /></div></div>)}</div>
    <Button type="button" variant="outline" onClick={() => onChange([...items, { id: crypto.randomUUID(), name: "Video mới", source: "Custom", sourceUrl: "https://", videoUrl: "https://", categories: ["Khác"], enabled: false }])}><Plus />Thêm video</Button>
  </SettingsCard>;
}

function splitCategories(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}
