"use client";

import {
  AlertTriangle,
  ArrowLeft,
  BellRing,
  CheckCircle2,
  CircleDollarSign,
  Image,
  Languages,
  Megaphone,
  MonitorSmartphone,
  Plus,
  Route as RouteIcon,
  Save,
  Settings2,
  Trash2,
  WalletCards,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PublicationStatusCard } from "@/components/admin/publication-status-card";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  createMonetizationLevel,
  updateMonetizationLevel,
} from "@/features/admin-monetization-levels/api/monetization-levels.client";
import { CountryCombobox } from "@/features/admin-monetization-levels/components/country-combobox";
import type {
  AdminMonetizationLevel,
  AdminMonetizationLevelPayload,
  MonetizationAdDensity,
  MonetizationBrowserFamily,
  MonetizationDeviceType,
  MonetizationLevelStatus,
  MonetizationRate,
  MonetizationRoute,
  MonetizationRouteMatchMode,
} from "@/features/admin-monetization-levels/types";
import { getAdminLanguages } from "@/features/languages/api/languages.client";
import type { Language } from "@/features/languages/types";
import {
  publicationStatusOptions,
  type PublicationStatus,
} from "@/types/publication-status";

const densityOptions: Array<{
  value: MonetizationAdDensity;
  label: string;
}> = [
  { value: "none", label: "Không hiển thị quảng cáo" },
  { value: "limited", label: "Mật độ giới hạn" },
  { value: "maximum", label: "Mật độ tối đa" },
];
const deviceOptions: Array<{
  value: MonetizationDeviceType;
  label: string;
}> = [
  { value: "any", label: "Mọi thiết bị" },
  { value: "desktop", label: "Desktop" },
  { value: "mobile", label: "Mobile" },
  { value: "tablet", label: "Tablet" },
];
const browserOptions: Array<{
  value: MonetizationBrowserFamily;
  label: string;
}> = [
  { value: "any", label: "Mọi trình duyệt" },
  { value: "chrome", label: "Chrome" },
  { value: "safari", label: "Safari" },
  { value: "firefox", label: "Firefox" },
  { value: "edge", label: "Edge" },
  { value: "other", label: "Khác" },
];
const routeModeOptions: Array<{
  value: MonetizationRouteMatchMode;
  label: string;
}> = [
  { value: "include", label: "Bao gồm" },
  { value: "exclude", label: "Ngoại trừ" },
];

export function MonetizationLevelEditor({
  level,
  template,
}: {
  level: AdminMonetizationLevel | null;
  template?: AdminMonetizationLevel;
}) {
  const router = useRouter();
  const initialPayload = React.useMemo(
    () => initialValues(level ?? template ?? null, Boolean(template)),
    [level, template],
  );
  const [baseline] = React.useState(() => JSON.stringify(initialPayload));
  const [values, setValues] =
    React.useState<AdminMonetizationLevelPayload>(initialPayload);
  const [languages, setLanguages] = React.useState<Language[]>([
    {
      id: -1,
      name: "Vietnamese",
      nativeName: "Tiếng Việt",
      locale: "vi",
      code: "vi",
      regional: "vi-VN",
      flag: "VN",
      isDefault: true,
      status: "published",
      sortOrder: 10,
      isRtl: false,
    },
    {
      id: -2,
      name: "English",
      nativeName: "English",
      locale: "en",
      code: "en",
      regional: "en-US",
      flag: "US",
      isDefault: false,
      status: "published",
      sortOrder: 20,
      isRtl: false,
    },
  ]);
  const [activeTab, setActiveTab] = React.useState("general");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [discardOpen, setDiscardOpen] = React.useState(false);
  const mode = level ? "update" : template ? "duplicate" : "create";
  const hasChanges = JSON.stringify(values) !== baseline;
  const canSubmit = mode === "update" ? hasChanges : true;

  React.useEffect(() => {
    let active = true;
    void getAdminLanguages()
      .then((result) => {
        if (!active) return;
        const relevant = result.items.filter(
          (language) =>
            language.status === "published" ||
            initialPayload.translations.some(
              ({ locale }) => locale === language.locale,
            ),
        );
        setLanguages(relevant);
        setValues((current) => ({
          ...current,
          translations: [
            ...current.translations,
            ...relevant
              .filter(
                (language) =>
                  !current.translations.some(
                    ({ locale }) => locale === language.locale,
                  ),
              )
              .map(({ locale }) => ({
                locale,
                name: "",
                description: "",
              })),
          ],
        }));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [initialPayload.translations]);

  React.useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasChanges || saving) return;
      event.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges, saving]);

  function leaveEditor() {
    router.push("/admin/monetization-levels");
  }

  function requestClose() {
    if (saving) return;
    if (hasChanges) {
      setDiscardOpen(true);
      return;
    }
    leaveEditor();
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validate(values, languages);
    if (validationError) {
      setError(validationError.message);
      setActiveTab(validationError.tab);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        ...values,
        translations: values.translations.filter(
          (translation) =>
            languages.find(
              ({ locale }) => locale === translation.locale,
            )?.isDefault || Boolean(translation.name.trim()),
        ),
      };
      if (level) {
        await updateMonetizationLevel(level.id, payload);
        toast.success("Đã cập nhật cấp độ kiếm tiền.");
      } else {
        await createMonetizationLevel(payload);
        toast.success("Đã tạo cấp độ kiếm tiền.");
      }
      router.push("/admin/monetization-levels");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Không thể lưu cấp độ kiếm tiền.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <form
        onSubmit={submit}
        className="mx-auto flex w-full max-w-[1400px] min-w-0 flex-col gap-6"
      >
        <AdminPageHeader
          title={
            mode === "update"
              ? "Chỉnh sửa cấp độ kiếm tiền"
              : mode === "duplicate"
                ? "Nhân bản cấp độ kiếm tiền"
                : "Thêm cấp độ kiếm tiền"
          }
          description={
            mode === "update"
              ? "Cập nhật nội dung đa ngôn ngữ, trải nghiệm quảng cáo, direct route và rate CPM của cấp độ."
              : mode === "duplicate"
                ? "Rà soát key và cấu hình được sao chép trước khi tạo thành một cấp độ mới."
                : "Thiết lập đầy đủ cấp độ, bản dịch, điều hướng và rate trước khi đưa vào sử dụng."
          }
          leading={
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="mt-0.5 shrink-0"
              aria-label="Quay lại danh sách cấp độ"
              onClick={requestClose}
            >
              <ArrowLeft />
            </Button>
          }
          meta={
            <>
              <EditorStatus status={values.status} />
              {values.isDefault ? (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  Mặc định
                </span>
              ) : null}
            </>
          }
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={requestClose}
              >
                Hủy
              </Button>
              <SubmitButton saving={saving} disabled={!canSubmit} mode={mode} />
            </>
          }
        />

        <div className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-sm">
          <Tabs
            value={activeTab}
            onValueChange={(tab) => {
              setActiveTab(tab);
              setError("");
            }}
            className="min-w-0 gap-0"
          >
            <div className="overflow-x-auto border-b px-4 sm:px-6">
              <TabsList
                variant="line"
                className="h-12 min-w-max justify-start bg-transparent p-0"
              >
                <TabsTrigger value="general">
                  <Settings2 /> Cấu hình chung
                </TabsTrigger>
                {languages.map((language) => (
                  <TabsTrigger key={language.id} value={language.locale}>
                    <Languages /> {language.nativeName || language.name}
                    <CompletionDot
                      complete={hasTranslation(values, language.locale)}
                    />
                  </TabsTrigger>
                ))}
                <TabsTrigger value="routes">
                  <RouteIcon /> Routes
                  <CountBadge value={values.routes.length} />
                </TabsTrigger>
                <TabsTrigger value="rates">
                  <CircleDollarSign /> Rates
                  <CountBadge value={values.rates.length} />
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="min-w-0 px-4 py-5 sm:px-6 sm:py-6">
              <TabsContent value="general" className="mt-0">
                <GeneralFields values={values} setValues={setValues} />
              </TabsContent>
              {languages.map((language) => (
                <TabsContent
                  key={language.id}
                  value={language.locale}
                  className="mt-0"
                >
                  <TranslationFields
                    locale={language.locale}
                    languageName={language.nativeName || language.name}
                    values={values}
                    setValues={setValues}
                  />
                </TabsContent>
              ))}
              <TabsContent value="routes" className="mt-0">
                <RoutesFields values={values} setValues={setValues} />
              </TabsContent>
              <TabsContent value="rates" className="mt-0">
                <RatesFields values={values} setValues={setValues} />
              </TabsContent>
            </div>
          </Tabs>

          <div className="sticky bottom-0 z-10 flex flex-col gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
            {error ? (
              <div
                role="alert"
                className="flex min-w-0 items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {hasChanges
                  ? "Có thay đổi chưa được lưu."
                  : mode === "update"
                    ? "Cấu hình hiện tại đã đồng bộ."
                    : mode === "duplicate"
                      ? "Bản sao chưa được tạo."
                      : "Cấp độ mới chưa được tạo."}
              </p>
            )}
            <div className="flex shrink-0 justify-end gap-2 sm:hidden">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={requestClose}
              >
                Hủy
              </Button>
              <SubmitButton saving={saving} disabled={!canSubmit} mode={mode} />
            </div>
          </div>
        </div>
      </form>

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bỏ các thay đổi chưa lưu?</AlertDialogTitle>
            <AlertDialogDescription>
              Những cấu hình bạn vừa chỉnh sửa sẽ bị mất. Thao tác này không ảnh
              hưởng dữ liệu đã lưu trước đó.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Tiếp tục chỉnh sửa</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={leaveEditor}>
              Bỏ thay đổi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function SubmitButton({
  saving,
  disabled,
  mode,
}: {
  saving: boolean;
  disabled: boolean;
  mode: "create" | "duplicate" | "update";
}) {
  return (
    <Button type="submit" disabled={saving || disabled}>
      <Save />
      {saving
        ? "Đang lưu..."
        : mode === "update"
          ? "Lưu thay đổi"
          : mode === "duplicate"
            ? "Tạo bản sao"
            : "Tạo cấp độ"}
    </Button>
  );
}

function GeneralFields({ values, setValues }: EditorSectionProps) {
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_19rem]">
      <div className="space-y-6">
        <section className="space-y-4">
          <SectionHeader
            title="Thông tin hệ thống"
            description="Key được dùng trong code và không phụ thuộc ngôn ngữ hiển thị."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Key" htmlFor="monetization-key">
              <Input
                id="monetization-key"
                value={values.key}
                placeholder="balanced"
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    key: event.target.value.toLowerCase(),
                  }))
                }
              />
            </FormField>
            <FormField label="Thứ tự" htmlFor="monetization-sort-order">
              <Input
                id="monetization-sort-order"
                type="number"
                min={0}
                max={10000}
                value={values.sortOrder}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    sortOrder: integerValue(event.target.value),
                  }))
                }
              />
            </FormField>
            <div className="grid gap-2">
              <Label htmlFor="monetization-default">Cấp độ mặc định</Label>
              <div className="flex h-9 items-center justify-between rounded-md border px-3">
                <span className="text-sm text-muted-foreground">
                  Tự gán cho link mới
                </span>
                <Switch
                  id="monetization-default"
                  checked={values.isDefault}
                  onCheckedChange={(isDefault) =>
                    setValues((current) => ({
                      ...current,
                      isDefault,
                      status: isDefault ? "published" : current.status,
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4 border-t pt-6">
          <SectionHeader
            title="Hiệu quả và số bước"
            description="Lợi nhuận được lưu bằng basis points để tránh sai số số thực."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Lợi nhuận (%)" htmlFor="monetization-profit">
              <Input
                id="monetization-profit"
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={values.metaData.profitBps / 100}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    metaData: {
                      ...current.metaData,
                      profitBps: Math.round(
                        Number(event.target.value || 0) * 100,
                      ),
                    },
                  }))
                }
              />
            </FormField>
            <FormField label="Số bước vượt link" htmlFor="monetization-steps">
              <Input
                id="monetization-steps"
                type="number"
                min={1}
                max={20}
                value={values.metaData.stepCount}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    metaData: {
                      ...current.metaData,
                      stepCount: integerValue(event.target.value),
                    },
                  }))
                }
              />
            </FormField>
          </div>
        </section>

        <section className="space-y-4 border-t pt-6">
          <SectionHeader
            title="Trải nghiệm người truy cập"
            description="Điều khiển mật độ từng định dạng quảng cáo của cấp độ."
          />
          <div className="grid gap-3 md:grid-cols-2">
            <ExperienceField
              icon={Megaphone}
              label="Quảng cáo pop-up"
              value={values.metaData.visitorExperience.popup}
              onChange={(popup) => updateExperience(setValues, { popup })}
            />
            <ExperienceField
              icon={Image}
              label="Quảng cáo banner"
              value={values.metaData.visitorExperience.banner}
              onChange={(banner) => updateExperience(setValues, { banner })}
            />
            <ExperienceField
              icon={MonitorSmartphone}
              label="Quảng cáo xen kẽ"
              value={values.metaData.visitorExperience.interstitial}
              onChange={(interstitial) =>
                updateExperience(setValues, { interstitial })
              }
            />
            <ExperienceField
              icon={BellRing}
              label="Quảng cáo thông báo"
              value={values.metaData.visitorExperience.notification}
              onChange={(notification) =>
                updateExperience(setValues, { notification })
              }
            />
          </div>
        </section>
      </div>
      <aside className="space-y-6">
        <PublicationStatusCard
          id="monetization-status"
          status={values.status}
          disabled={values.isDefault}
          disabledReason="Cấp độ mặc định luôn phải ở trạng thái xuất bản."
          onStatusChange={(status: PublicationStatus) =>
            setValues((current) => ({ ...current, status }))
          }
        />
        <LevelPreview values={values} />
      </aside>
    </div>
  );
}

function TranslationFields({
  locale,
  languageName,
  values,
  setValues,
}: EditorSectionProps & { locale: string; languageName: string }) {
  const translation = values.translations.find(
    (item) => item.locale === locale,
  ) ?? { locale, name: "", description: "" };
  const update = (patch: Partial<(typeof values.translations)[number]>) => {
    setValues((current) => ({
      ...current,
      translations: current.translations.map((item) =>
        item.locale === locale ? { ...item, ...patch } : item,
      ),
    }));
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title={`Nội dung ${languageName}`}
        description="Chỉ nội dung thuộc level được lưu trong bảng translation; label giao diện dùng next-intl."
      />
      <FormField label="Tên hiển thị" htmlFor={`level-name-${locale}`}>
        <Input
          id={`level-name-${locale}`}
          maxLength={100}
          value={translation.name}
          placeholder={`Tên cấp độ (${languageName})`}
          onChange={(event) => update({ name: event.target.value })}
        />
      </FormField>
      <FormField label="Mô tả" htmlFor={`level-description-${locale}`}>
        <Textarea
          id={`level-description-${locale}`}
          rows={5}
          maxLength={500}
          value={translation.description ?? ""}
          placeholder={`Mô tả trải nghiệm (${languageName})...`}
          onChange={(event) => update({ description: event.target.value })}
        />
      </FormField>
    </div>
  );
}

function LevelPreview({ values }: { values: AdminMonetizationLevelPayload }) {
  const name =
    values.translations.find((translation) => translation.locale === "vi")
      ?.name || "Tên cấp độ";
  const experience = values.metaData.visitorExperience;

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b bg-muted/20 px-4 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Live configuration preview
        </p>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-semibold tracking-[-0.02em]">
              {name}
            </h3>
            <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
              {values.key || "level-key"}
            </p>
          </div>
          <EditorStatus status={values.status} />
        </div>

        <div className="mt-5 grid grid-cols-2 divide-x rounded-lg border">
          <div className="p-3">
            <p className="text-[11px] text-muted-foreground">Lợi nhuận</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {(values.metaData.profitBps / 100).toLocaleString("vi-VN", {
                maximumFractionDigits: 2,
              })}
              %
            </p>
          </div>
          <div className="p-3">
            <p className="text-[11px] text-muted-foreground">Số bước</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {values.metaData.stepCount}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <PreviewRow label="Pop-up" value={densityLabel(experience.popup)} />
          <PreviewRow label="Banner" value={densityLabel(experience.banner)} />
          <PreviewRow
            label="Xen kẽ"
            value={densityLabel(experience.interstitial)}
          />
          <PreviewRow
            label="Thông báo"
            value={densityLabel(experience.notification)}
          />
        </div>

        <div className="mt-5 flex items-center justify-between border-t pt-4 text-xs">
          <span className="text-muted-foreground">Routing / Rates</span>
          <span className="font-medium tabular-nums">
            {values.routes.length} / {values.rates.length}
          </span>
        </div>
      </div>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate text-right font-medium">{value}</span>
    </div>
  );
}

function RoutesFields({ values, setValues }: EditorSectionProps) {
  const hasFallbackRoute = values.routes.some(
    (route) =>
      route.enabled &&
      route.countryCode === "ALL" &&
      route.deviceType === "any" &&
      route.browserFamily === "any",
  );
  const addRoute = () =>
    setValues((current) => ({
      ...current,
      routes: [
        ...current.routes,
        {
          id: nextRouteId(),
          countryCode: hasFallbackRoute ? "VN" : "ALL",
          countryMode: "include",
          deviceType: "any",
          deviceMode: "include",
          browserFamily: "any",
          browserMode: "include",
          targetUrl: "https://",
          priority: current.routes.length * 10,
          weight: 100,
          enabled: true,
        },
      ],
    }));
  const updateRoute = (index: number, patch: Partial<MonetizationRoute>) =>
    setValues((current) => ({
      ...current,
      routes: current.routes.map((route, routeIndex) =>
        routeIndex === index ? { ...route, ...patch } : route,
      ),
    }));
  const removeRoute = (index: number) =>
    setValues((current) => ({
      ...current,
      routes: current.routes.filter((_, routeIndex) => routeIndex !== index),
    }));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <SectionHeader
          title="Direct routes"
          description="Chọn đích chuyển hướng theo quốc gia, thiết bị và trình duyệt."
        />
        <Button type="button" size="sm" onClick={addRoute}>
          <Plus /> Thêm route
        </Button>
      </div>
      <ConfigurationNotice
        healthy={hasFallbackRoute || values.routes.length === 0}
        title={
          values.routes.length === 0
            ? "Đang dùng luồng chuyển hướng mặc định"
            : hasFallbackRoute
              ? "Đã có route fallback"
              : "Thiếu route fallback"
        }
        description={
          values.routes.length === 0
            ? "Level không override direct link; runtime sẽ dùng destination mặc định."
            : hasFallbackRoute
              ? "Traffic không khớp rule cụ thể vẫn có điểm đến an toàn."
              : "Nên thêm rule ALL + mọi thiết bị + mọi trình duyệt để tránh traffic không có điểm đến."
        }
      />
      {values.routes.length ? (
        values.routes.map((route, index) => (
          <div key={route.id} className="rounded-lg border bg-card p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <RouteIcon className="size-4 text-primary" />
                <span className="font-mono text-xs">{route.id}</span>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={route.enabled}
                  aria-label={`Bật route ${route.id}`}
                  onCheckedChange={(enabled) => updateRoute(index, { enabled })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Xóa route ${route.id}`}
                  onClick={() => removeRoute(index)}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
            </div>
            <div className="rounded-lg border bg-muted/15 p-4">
              <div className="mb-4">
                <h4 className="text-sm font-medium">Điều kiện traffic</h4>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Traffic phải thỏa đồng thời cả ba điều kiện để route được
                  chọn.
                </p>
              </div>
              <div className="grid gap-3 lg:grid-cols-3">
                <RouteConditionField
                  label="Quốc gia"
                  controlId={`route-country-${index}`}
                  mode={route.countryMode}
                  onModeChange={(countryMode) =>
                    updateRoute(index, {
                      countryMode,
                      ...(countryMode === "exclude" &&
                      route.countryCode === "ALL"
                        ? { countryCode: "VN" }
                        : {}),
                    })
                  }
                  description={
                    route.countryMode === "exclude"
                      ? "Mọi quốc gia ngoại trừ lựa chọn."
                      : route.countryCode === "ALL"
                        ? "Không giới hạn quốc gia."
                        : "Chỉ quốc gia được lựa chọn."
                  }
                >
                  <CountryCombobox
                    id={`route-country-${index}`}
                    value={route.countryCode}
                    allowAll={route.countryMode === "include"}
                    onChange={(countryCode) =>
                      updateRoute(index, { countryCode })
                    }
                  />
                </RouteConditionField>
                <RouteConditionField
                  label="Thiết bị"
                  controlId={`route-device-${index}`}
                  mode={route.deviceMode}
                  onModeChange={(deviceMode) =>
                    updateRoute(index, {
                      deviceMode,
                      ...(deviceMode === "exclude" &&
                      route.deviceType === "any"
                        ? { deviceType: "mobile" }
                        : {}),
                    })
                  }
                  description={
                    route.deviceMode === "exclude"
                      ? "Mọi thiết bị ngoại trừ lựa chọn."
                      : route.deviceType === "any"
                        ? "Không giới hạn thiết bị."
                        : "Chỉ loại thiết bị được lựa chọn."
                  }
                >
                  <DeviceSelect
                    id={`route-device-${index}`}
                    value={route.deviceType}
                    allowAny={route.deviceMode === "include"}
                    onChange={(deviceType) =>
                      updateRoute(index, { deviceType })
                    }
                  />
                </RouteConditionField>
                <RouteConditionField
                  label="Trình duyệt"
                  controlId={`route-browser-${index}`}
                  mode={route.browserMode}
                  onModeChange={(browserMode) =>
                    updateRoute(index, {
                      browserMode,
                      ...(browserMode === "exclude" &&
                      route.browserFamily === "any"
                        ? { browserFamily: "chrome" }
                        : {}),
                    })
                  }
                  description={
                    route.browserMode === "exclude"
                      ? "Mọi trình duyệt ngoại trừ lựa chọn."
                      : route.browserFamily === "any"
                        ? "Không giới hạn trình duyệt."
                        : "Chỉ trình duyệt được lựa chọn."
                  }
                >
                  <BrowserSelect
                    id={`route-browser-${index}`}
                    value={route.browserFamily}
                    allowAny={route.browserMode === "include"}
                    onChange={(browserFamily) =>
                      updateRoute(index, { browserFamily })
                    }
                  />
                </RouteConditionField>
              </div>
              <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
                Rule hiện tại:{" "}
                <span className="font-medium text-foreground">
                  {routeRuleSummary(route)}
                </span>
              </p>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <div className="md:col-span-2 xl:col-span-4">
                <FormField label="Target URL" htmlFor={`route-url-${index}`}>
                  <Input
                    id={`route-url-${index}`}
                    type="url"
                    value={route.targetUrl}
                    placeholder="https://example.com/step"
                    onChange={(event) =>
                      updateRoute(index, { targetUrl: event.target.value })
                    }
                  />
                </FormField>
              </div>
              <FormField label="Ưu tiên" htmlFor={`route-priority-${index}`}>
                <Input
                  id={`route-priority-${index}`}
                  type="number"
                  min={0}
                  max={10000}
                  value={route.priority}
                  onChange={(event) =>
                    updateRoute(index, {
                      priority: integerValue(event.target.value),
                    })
                  }
                />
              </FormField>
              <FormField label="Trọng số" htmlFor={`route-weight-${index}`}>
                <Input
                  id={`route-weight-${index}`}
                  type="number"
                  min={1}
                  max={100}
                  value={route.weight}
                  onChange={(event) =>
                    updateRoute(index, {
                      weight: integerValue(event.target.value),
                    })
                  }
                />
              </FormField>
            </div>
          </div>
        ))
      ) : (
        <EmptyConfiguration
          icon={RouteIcon}
          title="Chưa có direct route"
          description="Nếu không có route, hệ thống sẽ dùng luồng mặc định."
          actionLabel="Thêm route đầu tiên"
          onAction={addRoute}
        />
      )}
    </div>
  );
}

function RouteConditionField({
  label,
  controlId,
  mode,
  onModeChange,
  description,
  children,
}: {
  label: string;
  controlId: string;
  mode: MonetizationRouteMatchMode;
  onModeChange: (mode: MonetizationRouteMatchMode) => void;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-lg border bg-background p-3 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor={controlId} className="text-sm font-medium">
          {label}
        </Label>
        <ToggleGroup
          type="single"
          value={mode}
          variant="outline"
          size="sm"
          onValueChange={(value: MonetizationRouteMatchMode) => {
            if (value) onModeChange(value);
          }}
          aria-label={`Phạm vi ${label.toLowerCase()}`}
        >
          {routeModeOptions.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              aria-label={`${option.label} ${label.toLowerCase()}`}
              className="px-2.5 text-xs"
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="mt-3">{children}</div>
      <p className="mt-2 min-h-5 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function BrowserSelect({
  id,
  value,
  allowAny = true,
  onChange,
}: {
  id: string;
  value: MonetizationBrowserFamily;
  allowAny?: boolean;
  onChange: (value: MonetizationBrowserFamily) => void;
}) {
  const options = allowAny
    ? browserOptions
    : browserOptions.filter((option) => option.value !== "any");

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function routeRuleSummary(route: MonetizationRoute) {
  const country =
    route.countryCode === "ALL" ? "mọi quốc gia" : route.countryCode;
  const device =
    deviceOptions.find((option) => option.value === route.deviceType)?.label ??
    route.deviceType;
  const browser =
    browserOptions.find((option) => option.value === route.browserFamily)
      ?.label ?? route.browserFamily;
  const describe = (mode: MonetizationRouteMatchMode, value: string) =>
    mode === "exclude" ? `trừ ${value}` : value;

  return [
    describe(route.countryMode, country),
    describe(route.deviceMode, device.toLowerCase()),
    describe(route.browserMode, browser.toLowerCase()),
  ].join(" · ");
}

function RatesFields({ values, setValues }: EditorSectionProps) {
  const hasFallbackRate = values.rates.some(
    (rate) =>
      rate.enabled && rate.countryCode === "ALL" && rate.deviceType === "any",
  );
  const addRate = () =>
    setValues((current) => ({
      ...current,
      rates: [
        ...current.rates,
        {
          countryCode: hasFallbackRate ? "VN" : "ALL",
          deviceType: "any",
          baseCpm: "1.00",
          currency: "USD",
          dailyLimit: null,
          enabled: true,
        },
      ],
    }));
  const updateRate = (index: number, patch: Partial<MonetizationRate>) =>
    setValues((current) => ({
      ...current,
      rates: current.rates.map((rate, rateIndex) =>
        rateIndex === index ? { ...rate, ...patch } : rate,
      ),
    }));
  const removeRate = (index: number) =>
    setValues((current) => ({
      ...current,
      rates: current.rates.filter((_, rateIndex) => rateIndex !== index),
    }));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <SectionHeader
          title="Rate theo quốc gia"
          description="CPM gốc được kết hợp với lợi nhuận của level khi ghi nhận access hợp lệ."
        />
        <Button type="button" size="sm" onClick={addRate}>
          <Plus /> Thêm rate
        </Button>
      </div>
      <ConfigurationNotice
        healthy={hasFallbackRate || values.rates.length === 0}
        title={
          values.rates.length === 0
            ? "Chưa bật rate kiếm tiền"
            : hasFallbackRate
              ? "Đã có rate fallback"
              : "Thiếu rate fallback"
        }
        description={
          values.rates.length === 0
            ? "Level chưa có CPM và sẽ không tạo doanh thu theo quốc gia."
            : hasFallbackRate
              ? "Các quốc gia chưa được override sẽ sử dụng rate ALL."
              : "Nên thêm rate ALL + mọi thiết bị để không bỏ sót thị trường."
        }
      />
      {values.rates.length ? (
        values.rates.map((rate, index) => (
          <div key={`rate-${index}`} className="rounded-lg border bg-card p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <WalletCards className="size-4 text-primary" />
                <span className="text-sm font-medium">Rate #{index + 1}</span>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={rate.enabled}
                  aria-label={`Bật rate ${index + 1}`}
                  onCheckedChange={(enabled) => updateRate(index, { enabled })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Xóa rate ${index + 1}`}
                  onClick={() => removeRate(index)}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <FormField label="Quốc gia" htmlFor={`rate-country-${index}`}>
                <CountryCombobox
                  id={`rate-country-${index}`}
                  value={rate.countryCode}
                  onChange={(countryCode) => updateRate(index, { countryCode })}
                />
              </FormField>
              <FormField label="Thiết bị" htmlFor={`rate-device-${index}`}>
                <DeviceSelect
                  id={`rate-device-${index}`}
                  value={rate.deviceType}
                  onChange={(deviceType) => updateRate(index, { deviceType })}
                />
              </FormField>
              <FormField label="Base CPM" htmlFor={`rate-cpm-${index}`}>
                <Input
                  id={`rate-cpm-${index}`}
                  inputMode="decimal"
                  value={rate.baseCpm}
                  placeholder="1.50"
                  onChange={(event) =>
                    updateRate(index, { baseCpm: event.target.value })
                  }
                />
              </FormField>
              <FormField label="Tiền tệ" htmlFor={`rate-currency-${index}`}>
                <Input
                  id={`rate-currency-${index}`}
                  maxLength={3}
                  value={rate.currency}
                  onChange={(event) =>
                    updateRate(index, {
                      currency: event.target.value.toUpperCase(),
                    })
                  }
                />
              </FormField>
              <FormField label="Giới hạn/ngày" htmlFor={`rate-limit-${index}`}>
                <Input
                  id={`rate-limit-${index}`}
                  type="number"
                  min={1}
                  placeholder="Không giới hạn"
                  value={rate.dailyLimit ?? ""}
                  onChange={(event) =>
                    updateRate(index, {
                      dailyLimit: event.target.value
                        ? integerValue(event.target.value)
                        : null,
                    })
                  }
                />
              </FormField>
            </div>
          </div>
        ))
      ) : (
        <EmptyConfiguration
          icon={WalletCards}
          title="Chưa có rate quốc gia"
          description="Thêm rate mặc định ALL trước, sau đó override cho từng quốc gia."
          actionLabel="Thêm rate đầu tiên"
          onAction={addRate}
        />
      )}
    </div>
  );
}

function DeviceSelect({
  id,
  value,
  allowAny = true,
  onChange,
}: {
  id: string;
  value: MonetizationDeviceType;
  allowAny?: boolean;
  onChange: (value: MonetizationDeviceType) => void;
}) {
  const options = allowAny
    ? deviceOptions
    : deviceOptions.filter((option) => option.value !== "any");

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ExperienceField({
  icon: Icon,
  label,
  value,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: MonetizationAdDensity;
  onChange: (value: MonetizationAdDensity) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <Label className="text-sm">{label}</Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="mt-1 w-full border-0 px-0 shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {densityOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function EmptyConfiguration({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="grid min-h-56 place-items-center rounded-lg border border-dashed bg-muted/10 p-6 text-center">
      <div>
        <div className="mx-auto grid size-10 place-items-center rounded-md border bg-background">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <h3 className="mt-3 text-sm font-medium">{title}</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={onAction}
        >
          <Plus /> {actionLabel}
        </Button>
      </div>
    </div>
  );
}

function ConfigurationNotice({
  healthy,
  title,
  description,
}: {
  healthy: boolean;
  title: string;
  description: string;
}) {
  const Icon = healthy ? CheckCircle2 : AlertTriangle;
  return (
    <div
      className={
        healthy
          ? "flex gap-3 rounded-lg border bg-muted/15 px-4 py-3"
          : "flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3"
      }
    >
      <Icon
        className={
          healthy
            ? "mt-0.5 size-4 shrink-0 text-emerald-600"
            : "mt-0.5 size-4 shrink-0 text-amber-600"
        }
      />
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function CountBadge({ value }: { value: number }) {
  return (
    <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
      {value}
    </span>
  );
}

function CompletionDot({ complete }: { complete: boolean }) {
  return (
    <span
      aria-label={complete ? "Đã hoàn thành" : "Chưa hoàn thành"}
      className={
        complete
          ? "size-1.5 rounded-full bg-emerald-500"
          : "size-1.5 rounded-full bg-amber-500"
      }
    />
  );
}

function EditorStatus({ status }: { status: MonetizationLevelStatus }) {
  const option = publicationStatusOptions.find(
    (item) => item.value === status,
  );
  return (
    <span
      className={
        status === "published"
          ? "rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
          : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
      }
    >
      {option?.label ?? status}
    </span>
  );
}

type EditorSectionProps = {
  values: AdminMonetizationLevelPayload;
  setValues: React.Dispatch<
    React.SetStateAction<AdminMonetizationLevelPayload>
  >;
};

function initialValues(
  level: AdminMonetizationLevel | null,
  duplicate = false,
): AdminMonetizationLevelPayload {
  if (level) {
    const translations = level.translations.map((translation) => ({
      ...translation,
    }));
    for (const locale of ["vi", "en"]) {
      if (!translations.some((translation) => translation.locale === locale)) {
        translations.push({ locale, name: "", description: "" });
      }
    }
    return {
      key: duplicate
        ? `${level.key.slice(0, 44).replace(/-+$/, "")}-copy`
        : level.key,
      status: duplicate ? "draft" : level.status,
      isDefault: duplicate ? false : level.isDefault,
      sortOrder: duplicate ? level.sortOrder + 1 : level.sortOrder,
      translations,
      routes: level.routes.map((route) => ({
        ...route,
        countryMode: route.countryMode ?? "include",
        deviceMode: route.deviceMode ?? "include",
        browserMode: route.browserMode ?? "include",
      })),
      rates: level.rates.map((rate) => ({ ...rate })),
      metaData: structuredClone(level.metaData),
    };
  }
  return {
    key: "",
    status: "draft",
    isDefault: false,
    sortOrder: 0,
    translations: [
      { locale: "vi", name: "", description: "" },
      { locale: "en", name: "", description: "" },
    ],
    routes: [],
    rates: [],
    metaData: {
      version: 1,
      profitBps: 100,
      stepCount: 1,
      visitorExperience: {
        popup: "limited",
        banner: "none",
        interstitial: "none",
        notification: "none",
      },
    },
  };
}

function validate(
  values: AdminMonetizationLevelPayload,
  languages: Language[],
) {
  if (!/^[a-z][a-z0-9-]{1,49}$/.test(values.key)) {
    return {
      tab: "general",
      message:
        "Key cần từ 2–50 ký tự, bắt đầu bằng chữ thường và chỉ gồm chữ, số hoặc dấu gạch ngang.",
    };
  }
  if (values.isDefault && values.status !== "published") {
    return {
      tab: "general",
      message: "Cấp độ mặc định phải ở trạng thái xuất bản.",
    };
  }
  if (values.metaData.profitBps < 0 || values.metaData.profitBps > 10_000) {
    return { tab: "general", message: "Lợi nhuận phải nằm trong 0–100%." };
  }
  if (values.metaData.stepCount < 1 || values.metaData.stepCount > 20) {
    return { tab: "general", message: "Số bước phải nằm trong khoảng 1–20." };
  }
  for (const language of languages.filter(({ isDefault }) => isDefault)) {
    const locale = language.locale;
    if (
      !values.translations.find((item) => item.locale === locale)?.name.trim()
    ) {
      return {
        tab: locale,
        message: `Tên hiển thị ${language.nativeName || language.name} là bắt buộc.`,
      };
    }
  }
  const routeIds = values.routes.map((route) => route.id);
  if (new Set(routeIds).size !== routeIds.length) {
    return { tab: "routes", message: "Route ID không được trùng nhau." };
  }
  for (const route of values.routes) {
    if (!/^(?:[A-Z]{2}|ALL|ZZ)$/.test(route.countryCode)) {
      return {
        tab: "routes",
        message: `Mã quốc gia “${route.countryCode}” không hợp lệ.`,
      };
    }
    if (route.countryMode === "exclude" && route.countryCode === "ALL") {
      return {
        tab: "routes",
        message:
          "Không thể ngoại trừ tất cả quốc gia. Hãy chọn một quốc gia cụ thể.",
      };
    }
    if (route.deviceMode === "exclude" && route.deviceType === "any") {
      return {
        tab: "routes",
        message:
          "Không thể ngoại trừ mọi thiết bị. Hãy chọn một loại thiết bị cụ thể.",
      };
    }
    if (route.browserMode === "exclude" && route.browserFamily === "any") {
      return {
        tab: "routes",
        message:
          "Không thể ngoại trừ mọi trình duyệt. Hãy chọn một trình duyệt cụ thể.",
      };
    }
    if (!/^https?:\/\/.+/i.test(route.targetUrl)) {
      return {
        tab: "routes",
        message: `Target URL của route “${route.id}” phải bắt đầu bằng http:// hoặc https://.`,
      };
    }
  }
  const rateKeys = values.rates.map(
    (rate) => `${rate.countryCode}:${rate.deviceType}`,
  );
  if (new Set(rateKeys).size !== rateKeys.length) {
    return {
      tab: "rates",
      message: "Mỗi tổ hợp quốc gia và thiết bị chỉ được có một rate.",
    };
  }
  for (const rate of values.rates) {
    if (!/^(?:[A-Z]{2}|ALL|ZZ)$/.test(rate.countryCode)) {
      return {
        tab: "rates",
        message: `Mã quốc gia “${rate.countryCode}” không hợp lệ.`,
      };
    }
    if (!/^(?:0|[1-9]\d{0,7})(?:\.\d{1,6})?$/.test(rate.baseCpm)) {
      return {
        tab: "rates",
        message: `Base CPM “${rate.baseCpm}” không hợp lệ.`,
      };
    }
    if (rate.enabled && Number(rate.baseCpm) <= 0) {
      return {
        tab: "rates",
        message: "Base CPM của rate đang bật phải lớn hơn 0.",
      };
    }
  }
  return null;
}

function hasTranslation(values: AdminMonetizationLevelPayload, locale: string) {
  return Boolean(
    values.translations
      .find((translation) => translation.locale === locale)
      ?.name.trim(),
  );
}

function densityLabel(value: MonetizationAdDensity) {
  return (
    densityOptions.find((option) => option.value === value)?.label ?? value
  );
}

function updateExperience(
  setValues: EditorSectionProps["setValues"],
  patch: Partial<
    AdminMonetizationLevelPayload["metaData"]["visitorExperience"]
  >,
) {
  setValues((current) => ({
    ...current,
    metaData: {
      ...current.metaData,
      visitorExperience: {
        ...current.metaData.visitorExperience,
        ...patch,
      },
    },
  }));
}

function integerValue(value: string) {
  const parsed = Number.parseInt(value || "0", 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function nextRouteId() {
  return `route-${globalThis.crypto?.randomUUID?.().slice(0, 8) ?? Date.now()}`;
}
