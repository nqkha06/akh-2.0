"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Copy,
  Download,
  Home,
  Pencil,
  Plus,
  QrCode,
  Smartphone,
} from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";

import { Badge, PageHeader } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@/components/ui/credenza";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getBioPages, type BioPageDto } from "@/lib/api-client";
import LinkInBioGenerator from "./link-in-bio-generator";

type BioTab = "overview" | "create" | "analytics";
type QrErrorCorrection = "L" | "M" | "Q" | "H";

const bioTabs: Array<{
  id: BioTab;
  label: string;
  mobileLabel?: string;
  icon: LucideIcon;
}> = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "create", label: "Create", icon: Plus },
  // { id: "analytics", label: "Analytics", mobileLabel: "Stats", icon: BarChart3 },
];

function BioTabs({
  activeTab,
  onChange,
}: {
  activeTab: BioTab;
  onChange: (tab: BioTab) => void;
}) {
  return (
    <div className="mb-5 flex">
      <div className="inline-flex w-full rounded-2xl bg-slate-100/70 p-1 ring-1 ring-slate-200/70 sm:w-auto">
        {bioTabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`inline-flex h-10 flex-1 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold transition-all duration-200 sm:flex-none sm:px-4 ${
                active
                  ? "border-slate-200 bg-white text-slate-950 shadow-sm"
                  : "border-transparent text-slate-500 hover:bg-white/60 hover:text-slate-900"
              }`}
            >
              <Icon size={16} />
              {tab.mobileLabel ? (
                <>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.mobileLabel}</span>
                </>
              ) : (
                tab.label
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BioView() {
  const [activeTab, setActiveTab] = useState<BioTab>("overview");
  const [bioPages, setBioPages] = useState<BioPageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingBio, setEditingBio] = useState<BioPageDto | null>(null);

  const loadBioPages = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getBioPages();
      setBioPages(data);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không tải được danh sách bio.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadBioPages);
  }, [loadBioPages]);

  const handleBioSaved = (bioPage: BioPageDto) => {
    setBioPages((current) => [bioPage, ...current.filter((item) => item.id !== bioPage.id)]);
    if (editingBio) {
      setEditingBio(null);
      return;
    }
    setActiveTab("overview");
  };

  const startCreate = () => {
    setEditingBio(null);
    setActiveTab("create");
  };

  const startEdit = (bioPage: BioPageDto) => {
    setEditingBio(bioPage);
  };

  return (
    <>
      <PageHeader
        title="Link-in-bio"
        description="Quản lý trang bio, tạo landing mini và theo dõi hiệu suất từng link trong cùng một workspace."

      />

      <BioTabs activeTab={activeTab} onChange={(tab) => {
        setEditingBio(null);
        setActiveTab(tab);
      }} />

      {activeTab === "overview" ? (
        <BioOverview
          bioPages={bioPages}
          error={error}
          loading={loading}
          onCreate={startCreate}
          onEdit={startEdit}
        />
      ) : null}

      {activeTab === "create" ? (
        <LinkInBioGenerator
          key="new"
          showHeader={false}
          onSaved={handleBioSaved}
        />
      ) : null}

      <Credenza open={Boolean(editingBio)} onOpenChange={(open) => !open && setEditingBio(null)}>
        <CredenzaContent className="sm:max-w-6xl">
          <CredenzaHeader className="border-b border-slate-200">
            <CredenzaTitle>Chỉnh sửa Bio</CredenzaTitle>
            <CredenzaDescription>
              Cập nhật nội dung, giao diện và media của /b/{editingBio?.slug}.
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaBody className="bg-slate-50 px-4 py-5 sm:px-6">
            {editingBio ? (
              <LinkInBioGenerator
                key={editingBio.id}
                showHeader={false}
                initialBio={editingBio}
                onSaved={handleBioSaved}
              />
            ) : null}
          </CredenzaBody>
        </CredenzaContent>
      </Credenza>
    </>
  );
}

function BioOverview({
  bioPages,
  error,
  loading,
  onCreate,
  onEdit,
}: {
  bioPages: BioPageDto[];
  error: string;
  loading: boolean;
  onCreate: () => void;
  onEdit: (bioPage: BioPageDto) => void;
}) {
  return (
    <div className="space-y-5">
      <section>
        {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div> : null}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-72" />)}</div>
        ) : bioPages.length === 0 ? (
          <Card className="items-center border-dashed py-12 text-center">
            <Smartphone className="size-10 text-muted-foreground" />
            <CardHeader className="px-6"><CardTitle>Chưa có Bio page</CardTitle><p className="text-sm text-muted-foreground">Tạo trang Bio đầu tiên để có public profile /b/slug.</p></CardHeader>
            <Button onClick={onCreate}><Plus />Tạo Bio đầu tiên</Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {bioPages.map((page) => <BioPageCard key={page.id} page={page} onEdit={onEdit} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function BioPageCard({
  page,
  onEdit,
}: {
  page: BioPageDto;
  onEdit: (bioPage: BioPageDto) => void;
}) {
  const ctr = page.views > 0 ? `${((page.clicks / page.views) * 100).toFixed(1)}%` : "0%";
  const visibleLinks = page.customLinks.filter((link) => !page.hiddenLinks.includes(link.id)).length;

  return (
    <Card className="gap-0 transition-shadow hover:shadow-md">
      <CardHeader className="border-b">
        <CardTitle className="truncate">{page.name}</CardTitle>
        <p className="truncate text-sm text-muted-foreground">{page.publicUrl}</p>
        <CardAction><Badge tone={page.status === "published" ? "emerald" : "slate"}>{page.status}</Badge></CardAction>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-col items-start gap-1 rounded-lg bg-muted/50 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"><span className="text-muted-foreground">Nội dung public</span><span className="font-medium">{visibleLinks} link · {page.socialLinks.length} social · {page.widgets.length} widget</span></div>
        <div className="grid grid-cols-3 divide-x text-center"><div><p className="text-lg font-semibold">{page.views.toLocaleString("vi-VN")}</p><p className="text-xs text-muted-foreground">Views</p></div><div><p className="text-lg font-semibold">{page.clicks.toLocaleString("vi-VN")}</p><p className="text-xs text-muted-foreground">Clicks</p></div><div><p className="text-lg font-semibold">{ctr}</p><p className="text-xs text-muted-foreground">CTR</p></div></div>
      </CardContent>
      <CardFooter className="flex-col gap-2 border-t sm:flex-row sm:justify-between"><BioQuickActions page={page} visibleLinks={visibleLinks} ctr={ctr} /><Button variant="outline" className="w-full sm:w-auto" onClick={() => onEdit(page)}><Pencil />Chỉnh sửa</Button></CardFooter>
    </Card>
  );
}

function BioQuickActions({ page, visibleLinks, ctr }: { page: BioPageDto; visibleLinks: number; ctr: string }) {
  const publicUrl = useMemo(() => typeof window === "undefined" ? page.publicUrl : new URL(page.publicUrl, window.location.origin).toString(), [page.publicUrl]);
  const [qrSize, setQrSize] = useState(224);
  const [qrMargin, setQrMargin] = useState(1);
  const [qrErrorCorrection, setQrErrorCorrection] = useState<QrErrorCorrection>("M");
  const [qrImageSrc, setQrImageSrc] = useState("");

  useEffect(() => {
    let active = true;
    void QRCode.toDataURL(publicUrl, { width: qrSize, margin: qrMargin, errorCorrectionLevel: qrErrorCorrection, color: { dark: "#111827", light: "#ffffff" } })
      .then((dataUrl) => active && setQrImageSrc(dataUrl))
      .catch(() => active && setQrImageSrc(""));
    return () => { active = false; };
  }, [publicUrl, qrErrorCorrection, qrMargin, qrSize]);

  const copyPublicUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Đã sao chép link Bio");
    } catch {
      toast.error("Không thể sao chép link Bio");
    }
  };
  const downloadQr = () => {
    if (!qrImageSrc) return;
    const download = document.createElement("a");
    download.href = qrImageSrc;
    download.download = `${page.slug}-qr.png`;
    download.click();
  };

  return (
    <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:gap-1">
      <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => void copyPublicUrl()}><Copy />Sao chép</Button>

      <Credenza>
        <CredenzaTrigger asChild><Button variant="outline" size="sm" className="w-full sm:w-auto"><QrCode />QR code</Button></CredenzaTrigger>
        <CredenzaContent className="sm:max-w-xl">
          <CredenzaHeader><CredenzaTitle>QR code</CredenzaTitle></CredenzaHeader>
          <CredenzaBody className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2"><Label htmlFor={`bio-qr-size-${page.id}`}>Kích thước</Label><Input id={`bio-qr-size-${page.id}`} type="number" min={120} max={640} value={qrSize} onChange={(event) => setQrSize(Math.min(640, Math.max(120, Number(event.target.value) || 224)))} /></div>
              <div className="grid gap-2"><Label htmlFor={`bio-qr-margin-${page.id}`}>Viền</Label><Input id={`bio-qr-margin-${page.id}`} type="number" min={0} max={20} value={qrMargin} onChange={(event) => setQrMargin(Math.min(20, Math.max(0, Number(event.target.value) || 0)))} /></div>
              <div className="grid gap-2"><Label>Sửa lỗi</Label><Select value={qrErrorCorrection} onValueChange={(value) => setQrErrorCorrection(value as QrErrorCorrection)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(["L", "M", "Q", "H"] as QrErrorCorrection[]).map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed bg-muted/40 p-4">{qrImageSrc ? <img src={qrImageSrc} alt={`QR code for ${page.name}`} className="size-56 max-w-full" /> : <p className="text-sm text-muted-foreground">Không thể tạo QR code.</p>}</div>
            <p className="break-all rounded-lg bg-muted p-3 text-sm text-muted-foreground">{publicUrl}</p>
          </CredenzaBody>
          <CredenzaFooter className="flex-col gap-2 sm:flex-row sm:justify-between"><CredenzaClose asChild><Button variant="outline" className="w-full sm:w-auto">Đóng</Button></CredenzaClose><div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"><Button variant="outline" className="w-full sm:w-auto" onClick={() => void copyPublicUrl()}><Copy />Copy link</Button><Button className="w-full sm:w-auto" onClick={downloadQr} disabled={!qrImageSrc}><Download />Tải PNG</Button></div></CredenzaFooter>
        </CredenzaContent>
      </Credenza>

      <Credenza>
        <CredenzaTrigger asChild><Button variant="outline" size="sm" className="w-full sm:w-auto"><BarChart3 />Stats</Button></CredenzaTrigger>
        <CredenzaContent className="sm:max-w-xl">
          <CredenzaHeader><CredenzaTitle>Thống kê Bio</CredenzaTitle><CredenzaDescription>Ảnh chụp hiệu suất hiện tại của {page.name}.</CredenzaDescription></CredenzaHeader>
          <CredenzaBody className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Views", page.views.toLocaleString("vi-VN")], ["Clicks", page.clicks.toLocaleString("vi-VN")], ["CTR", ctr], ["Status", page.status]].map(([label, value]) => <div key={label} className="rounded-lg border bg-muted/40 p-3"><p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 truncate text-lg font-semibold">{value}</p></div>)}</div>
            <div className="space-y-3 rounded-xl border p-4 text-sm"><div className="flex justify-between gap-4"><span className="text-muted-foreground">Public links</span><span className="font-medium">{visibleLinks}</span></div><div className="flex justify-between gap-4"><span className="text-muted-foreground">Social profiles</span><span className="font-medium">{page.socialLinks.length}</span></div><div className="flex justify-between gap-4"><span className="text-muted-foreground">Widgets</span><span className="font-medium">{page.widgets.length}</span></div><p className="break-all border-t pt-3 text-muted-foreground">{publicUrl}</p></div>
          </CredenzaBody>
          <CredenzaFooter><CredenzaClose asChild><Button variant="outline">Đóng</Button></CredenzaClose></CredenzaFooter>
        </CredenzaContent>
      </Credenza>
    </div>
  );
}
