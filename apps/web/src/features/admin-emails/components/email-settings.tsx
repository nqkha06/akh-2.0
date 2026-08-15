"use client";

import * as React from "react";
import { AlertTriangle, Cloud, LoaderCircle, RefreshCw, Save, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import { checkEmailConnection, getEmailSettings, updateEmailSettings } from "../api/emails.client";
import type { EmailSettings } from "../types";
import { EmailEmptyState, EmailStatusBadge, formatEmailDate } from "./email-ui";

type SendingKey = "transactionalEnabled" | "marketingEnabled";

export function EmailSettingsTab({ onUpdated }: { onUpdated: () => void }) {
  const permissions = useAdminPermissions();
  const canUpdate = permissions.includes("emails.settings.update");
  const [settings, setSettings] = React.useState<EmailSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [checking, setChecking] = React.useState(false);
  const [pauseTarget, setPauseTarget] = React.useState<SendingKey | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try { setSettings(await getEmailSettings()); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Không thể tải email settings."); }
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  async function save() {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await updateEmailSettings({
        provider: settings.provider,
        defaultLocale: settings.defaultLocale,
        transactionalEnabled: settings.transactionalEnabled,
        marketingEnabled: settings.marketingEnabled,
        globalReplyToEmail: settings.globalReplyToEmail,
        trackingEnabled: settings.trackingEnabled,
        openTrackingEnabled: settings.openTrackingEnabled,
        clickTrackingEnabled: settings.clickTrackingEnabled,
      });
      setSettings(updated); onUpdated(); toast.success("Đã lưu email settings.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể lưu settings."); }
    finally { setSaving(false); }
  }

  async function checkConnection() {
    setChecking(true);
    try {
      const health = await checkEmailConnection();
      setSettings((current) => current ? { ...current, providerStatus: health.status, providerHealth: health, awsRegion: health.region } : current);
      if (health.status === "configured") toast.success(health.message);
      else toast.warning(health.message);
      onUpdated();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể kiểm tra SES."); }
    finally { setChecking(false); }
  }

  if (loading) return <div className="flex h-52 items-center justify-center"><LoaderCircle className="size-5 animate-spin text-muted-foreground" /></div>;
  if (!settings) return <EmailEmptyState title="Không thể tải settings" description="Kiểm tra API hoặc thử làm mới trang." warning action={<Button onClick={() => void load()}><RefreshCw />Thử lại</Button>} />;

  const health = settings.providerHealth;
  const trackingSupported = health.trackingSupported;
  return (
    <div className="space-y-6">
      <div><h2 className="text-lg font-semibold">Email settings</h2><p className="text-sm text-muted-foreground">Business-level controls. AWS secrets chỉ tồn tại trong deployment environment.</p></div>
      {health.status === "incomplete" ? <Alert variant="destructive"><ShieldAlert /><AlertTitle>AWS credentials chưa được cấu hình trên server</AlertTitle><AlertDescription>Thêm AWS_REGION, AWS_ACCESS_KEY_ID và AWS_SECRET_ACCESS_KEY vào deployment environment, sau đó restart API. Secret không được lưu trong database hoặc nhập từ màn hình này.</AlertDescription></Alert> : null}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2"><Cloud className="size-5" />Provider</CardTitle><CardDescription className="mt-2">Kết nối Amazon SES qua AWS SDK v3.</CardDescription></div><EmailStatusBadge status={health.status} label={health.status === "configured" ? "Connected" : health.status} /></div></CardHeader>
          <CardContent className="space-y-4">
            <SettingRow label="Provider" value="Amazon SES" />
            <SettingRow label="AWS region" value={health.region || "Chưa cấu hình"} mono />
            <SettingRow label="Configuration sets" value={health.configurationSetsReady ? "transactional · marketing" : "Chưa đầy đủ"} />
            <p className="text-sm leading-6 text-muted-foreground">{health.message}</p>
            {canUpdate ? <Button variant="outline" onClick={() => void checkConnection()} disabled={checking}>{checking ? <LoaderCircle className="animate-spin" /> : <RefreshCw />}Check connection</Button> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Sending controls</CardTitle><CardDescription>Pause sẽ chặn email mới của luồng tương ứng.</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <ToggleRow label="Transactional email" description="Email xác minh, bảo mật, payout và hệ thống." checked={settings.transactionalEnabled} disabled={!canUpdate} onCheckedChange={(checked) => checked ? setSettings({ ...settings, transactionalEnabled: true }) : setPauseTarget("transactionalEnabled")} />
            <ToggleRow label="Marketing email" description="Chỉ queue khi user opt-in và không bị suppress." checked={settings.marketingEnabled} disabled={!canUpdate} onCheckedChange={(checked) => checked ? setSettings({ ...settings, marketingEnabled: true }) : setPauseTarget("marketingEnabled")} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Delivery defaults</CardTitle><CardDescription>Không chứa AWS credential hoặc secret.</CardDescription></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="email-default-locale">Default locale</Label><Select disabled={!canUpdate} value={settings.defaultLocale} onValueChange={(value) => setSettings({ ...settings, defaultLocale: value })}><SelectTrigger id="email-default-locale" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="vi">Tiếng Việt</SelectItem><SelectItem value="en">English</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="global-reply-to">Global reply-to</Label><Input id="global-reply-to" type="email" disabled={!canUpdate} value={settings.globalReplyToEmail || ""} onChange={(event) => setSettings({ ...settings, globalReplyToEmail: event.target.value || null })} placeholder="support@domain.com" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Tracking controls</CardTitle><CardDescription>{trackingSupported ? "Configuration sets đã sẵn sàng cho event tracking." : "Bị khóa đến khi cả hai SES configuration sets sẵn sàng."}</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <ToggleRow label="Tracking" description="Cho phép lifecycle tracking qua SES events." checked={settings.trackingEnabled} disabled={!canUpdate || !trackingSupported} onCheckedChange={(checked) => setSettings({ ...settings, trackingEnabled: checked, ...(!checked ? { openTrackingEnabled: false, clickTrackingEnabled: false } : {}) })} />
            <ToggleRow label="Open tracking" description="Ghi nhận open event khi provider hỗ trợ." checked={settings.openTrackingEnabled} disabled={!canUpdate || !trackingSupported || !settings.trackingEnabled} onCheckedChange={(checked) => setSettings({ ...settings, openTrackingEnabled: checked })} />
            <ToggleRow label="Click tracking" description="Ghi nhận click event qua configuration set." checked={settings.clickTrackingEnabled} disabled={!canUpdate || !trackingSupported || !settings.trackingEnabled} onCheckedChange={(checked) => setSettings({ ...settings, clickTrackingEnabled: checked })} />
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-muted-foreground">Last updated by {settings.updatedBy?.name || "System"} · {formatEmailDate(settings.updatedAt)}</p>{canUpdate ? <Button onClick={() => void save()} disabled={saving}>{saving ? <LoaderCircle className="animate-spin" /> : <Save />}Save settings</Button> : null}</div>

      <AlertDialog open={Boolean(pauseTarget)} onOpenChange={(open) => !open && setPauseTarget(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Tạm dừng {pauseTarget === "marketingEnabled" ? "marketing" : "transactional"} email?</AlertDialogTitle><AlertDialogDescription>{pauseTarget === "marketingEnabled" ? "Các email marketing mới sẽ không được queue, kể cả khi user đã opt-in." : "Email xác minh, password reset, payout và email hệ thống mới sẽ bị chặn. Phase này không có emergency override."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Giữ hoạt động</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => { if (pauseTarget) setSettings({ ...settings, [pauseTarget]: false }); setPauseTarget(null); }}><AlertTriangle />Tạm dừng</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ToggleRow({ label, description, checked, disabled, onCheckedChange }: { label: string; description: string; checked: boolean; disabled: boolean; onCheckedChange: (checked: boolean) => void }) { return <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium">{label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div><Switch checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} aria-label={label} /></div>; }
function SettingRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) { return <div className="flex items-center justify-between gap-4 border-b pb-3 last:border-0"><span className="text-sm text-muted-foreground">{label}</span><span className={`text-right text-sm font-medium ${mono ? "font-mono" : ""}`}>{value}</span></div>; }
