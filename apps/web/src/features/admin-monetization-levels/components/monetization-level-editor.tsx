"use client";

import {
  AlertTriangle,
  ArrowLeft,
  BellRing,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Copy,
  GripVertical,
  Image as ImageIcon,
  Link2,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  MonetizationAd,
  MonetizationAdFormat,
  MonetizationAdPlacement,
  MonetizationBrowserFamily,
  MonetizationDeviceType,
  MonetizationDeliveryMode,
  MonetizationLevelStatus,
  MonetizationOperatingSystem,
  MonetizationRate,
  MonetizationRoute,
  MonetizationRouteMatchMode,
  MonetizationSmartlink,
  MonetizationSmartlinkOverrides,
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
const adFormatOptions: Array<{ value: MonetizationAdFormat; label: string }> = [
  { value: "smartlink", label: "Smartlink" },
  { value: "banner", label: "Banner" },
  { value: "script", label: "Script adapter" },
];
const adPlacementOptions: Array<{
  value: MonetizationAdPlacement;
  label: string;
}> = [
  { value: "unlock_redirect", label: "Unlock redirect" },
  { value: "popunder", label: "Popunder" },
  { value: "stu_before", label: "Trước STU" },
  { value: "stu_after", label: "Sau STU" },
  { value: "safe_overlay_top", label: "Safe overlay trên" },
  { value: "safe_overlay_bottom", label: "Safe overlay dưới" },
];
const operatingSystemOptions: Array<{
  value: MonetizationOperatingSystem;
  label: string;
}> = [
  { value: "any", label: "Mọi OS" },
  { value: "android", label: "Android" },
  { value: "ios", label: "iOS" },
  { value: "windows", label: "Windows" },
  { value: "macos", label: "macOS" },
  { value: "linux", label: "Linux" },
  { value: "other", label: "Khác" },
];
const deliveryModeOptions: Array<{
  value: MonetizationDeliveryMode;
  label: string;
}> = [
  { value: "any", label: "Mọi kiểu hiển thị" },
  { value: "original", label: "STU gốc" },
  { value: "random_post", label: "Bài viết ngẫu nhiên" },
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
        className="mx-auto flex w-full max-w-[1560px] min-w-0 flex-col gap-6"
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
                <Badge variant="secondary">Mặc định</Badge>
              ) : null}
            </>
          }
          actions={
            <div className="hidden items-center gap-2 sm:flex">
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
          }
        />

        <Tabs
          value={activeTab}
          onValueChange={(tab) => {
            setActiveTab(tab);
            setError("");
          }}
          className="grid min-w-0 items-start gap-5 xl:grid-cols-[220px_minmax(0,1fr)_300px] xl:gap-6"
        >
          <nav
            aria-label="Điều hướng cấu hình cấp độ"
            className="min-w-0 rounded-xl border border-border/60 bg-card p-1 xl:sticky xl:top-6 xl:p-3"
          >
            <ScrollArea className="w-full whitespace-nowrap">
              <TabsList
                className="h-auto min-w-max justify-start gap-1 bg-transparent p-0 xl:w-full xl:min-w-0 xl:flex-col xl:items-stretch"
              >
                <NavigationGroup label="Cấu hình">
                  <EditorTabTrigger value="general" icon={Settings2}>
                    Cấu hình chung
                  </EditorTabTrigger>
                  <EditorTabTrigger value="show" icon={MonitorSmartphone}>
                    Cấu hình Show
                  </EditorTabTrigger>
                </NavigationGroup>

                <NavigationGroup label="Nội dung">
                  {languages.map((language) => (
                    <EditorTabTrigger
                      key={language.id}
                      value={language.locale}
                      icon={Languages}
                      trailing={
                        <CompletionDot
                          complete={hasTranslation(values, language.locale)}
                        />
                      }
                    >
                      {language.nativeName || language.name}
                    </EditorTabTrigger>
                  ))}
                </NavigationGroup>

                <NavigationGroup label="Kiếm tiền">
                  <EditorTabTrigger
                    value="routes"
                    icon={RouteIcon}
                    trailing={<CountBadge value={values.routes.length} />}
                  >
                    Routes
                  </EditorTabTrigger>
                  <EditorTabTrigger
                    value="rates"
                    icon={CircleDollarSign}
                    trailing={<CountBadge value={values.rates.length} />}
                  >
                    Rates
                  </EditorTabTrigger>
                  <EditorTabTrigger
                    value="ads"
                    icon={Megaphone}
                    trailing={<CountBadge value={values.ads.length} />}
                  >
                    Quảng cáo
                  </EditorTabTrigger>
                </NavigationGroup>
              </TabsList>
              <ScrollBar orientation="horizontal" className="xl:hidden" />
            </ScrollArea>
          </nav>

          <main className="min-w-0 overflow-hidden rounded-xl border border-border/60 bg-card">
            <div className="min-w-0 p-5 sm:p-6 lg:p-8">
              <TabsContent value="general" className="mt-0">
                <GeneralFields values={values} setValues={setValues} />
              </TabsContent>
              <TabsContent value="show" className="mt-0">
                <ShowFields values={values} setValues={setValues} />
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
              <TabsContent value="ads" className="mt-0">
                <AdsFields values={values} setValues={setValues} />
              </TabsContent>
            </div>

            <div className="sticky bottom-0 z-10 flex flex-col gap-3 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
              {error ? (
                <div
                  role="alert"
                  className="flex min-w-0 items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                >
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span
                    className={
                      hasChanges
                        ? "size-2 rounded-full bg-amber-500"
                        : "size-2 rounded-full bg-emerald-500"
                    }
                  />
                  <span>
                    {hasChanges
                      ? "Có thay đổi chưa được lưu."
                      : mode === "update"
                        ? "Cấu hình hiện tại đã đồng bộ."
                        : mode === "duplicate"
                          ? "Bản sao chưa được tạo."
                          : "Cấp độ mới chưa được tạo."}
                  </span>
                </div>
              )}
              <div className="flex shrink-0 justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={requestClose}
                >
                  Hủy
                </Button>
                <SubmitButton
                  saving={saving}
                  disabled={!canSubmit}
                  mode={mode}
                />
              </div>
            </div>
          </main>

          <aside className="min-w-0 xl:sticky xl:top-6">
            <ConfigurationSummary values={values} setValues={setValues} />
          </aside>
        </Tabs>
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

function NavigationGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="contents xl:block xl:w-full xl:space-y-1">
      <p className="hidden px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground first:pt-1 xl:block">
        {label}
      </p>
      {children}
    </div>
  );
}

function EditorTabTrigger({
  value,
  icon: Icon,
  trailing,
  children,
}: {
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <TabsTrigger
      value={value}
      className="h-9 w-auto flex-none justify-start rounded-lg px-3 after:hidden data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none xl:w-full"
    >
      <Icon className="size-4" />
      <span className="truncate">{children}</span>
      {trailing ? <span className="ml-auto">{trailing}</span> : null}
    </TabsTrigger>
  );
}

function GeneralFields({ values, setValues }: EditorSectionProps) {
  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <SectionHeader
          title="Thông tin hệ thống"
          description="Key được dùng trong code và không phụ thuộc ngôn ngữ hiển thị."
        />
        <div className="grid gap-5 sm:grid-cols-2">
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
            <div className="flex h-9 items-center justify-between rounded-lg border border-border/60 px-3">
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

      <Separator className="bg-border/60" />

      <section className="space-y-5">
        <SectionHeader
          title="Hiệu quả"
          description="Lợi nhuận được lưu bằng basis points để tránh sai số số thực."
        />
        <div className="grid gap-5 sm:grid-cols-2">
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
        </div>
      </section>

      <Separator className="bg-border/60" />

      <section className="space-y-5">
        <SectionHeader
          title="Trải nghiệm người truy cập"
          description="Điều khiển mật độ từng định dạng quảng cáo của cấp độ."
        />
        <div className="overflow-hidden rounded-xl border border-border/60">
          <ExperienceField
            icon={Megaphone}
            label="Quảng cáo pop-up"
            description="Mật độ pop-up trong hành trình mở khóa."
            value={values.metaData.visitorExperience.popup}
            onChange={(popup) => updateExperience(setValues, { popup })}
          />
          <Separator className="bg-border/60" />
          <ExperienceField
            icon={ImageIcon}
            label="Quảng cáo banner"
            description="Mật độ banner trong các vùng quảng cáo hỗ trợ."
            value={values.metaData.visitorExperience.banner}
            onChange={(banner) => updateExperience(setValues, { banner })}
          />
          <Separator className="bg-border/60" />
          <ExperienceField
            icon={MonitorSmartphone}
            label="Quảng cáo xen kẽ"
            description="Mật độ quảng cáo giữa các bước STU."
            value={values.metaData.visitorExperience.interstitial}
            onChange={(interstitial) =>
              updateExperience(setValues, { interstitial })
            }
          />
          <Separator className="bg-border/60" />
          <ExperienceField
            icon={BellRing}
            label="Quảng cáo thông báo"
            description="Mật độ định dạng thông báo cho người truy cập."
            value={values.metaData.visitorExperience.notification}
            onChange={(notification) =>
              updateExperience(setValues, { notification })
            }
          />
        </div>
      </section>
    </div>
  );
}

function ShowFields({ values, setValues }: EditorSectionProps) {
  const pageCount = values.metaData.stepCount;
  const previewCounts = splitActionCounts(5, Math.min(pageCount, 5));

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Cấu hình phân trang STU"
        description="Chia đều action thành nhiều page. Visitor phải hoàn thành page hiện tại trước khi chuyển sang page kế tiếp."
      />
      <section className="grid items-start gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <div className="space-y-4">
          <FormField label="Số page" htmlFor="monetization-show-pages">
            <Input
              id="monetization-show-pages"
              type="number"
              min={1}
              max={20}
              value={pageCount}
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
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-xs leading-5 text-muted-foreground">
            Nếu số page lớn hơn số action, runtime tự giảm để không tạo page trống. Chỉ page cuối mới mở destination và hoàn tất visit.
          </div>
        </div>
        <div className="rounded-xl border border-border/60 bg-background p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Ví dụ với 5 action</p>
              <p className="mt-1 text-xs text-muted-foreground">Action được chia cân bằng, page trước nhận phần dư.</p>
            </div>
            <Badge variant="secondary">{previewCounts.length} page thực tế</Badge>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {previewCounts.map((count, index) => (
              <div key={index} className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium">Page {index + 1}</span>
                  <Badge variant="outline">{count} action</Badge>
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  {index === previewCounts.length - 1
                    ? "Destination mở tại page này"
                    : `Nút cuối chuyển tới Page ${index + 2}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
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
    <div className="space-y-6">
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

function ConfigurationSummary({
  values,
  setValues,
}: EditorSectionProps) {
  const name =
    values.translations.find((translation) => translation.locale === "vi")
      ?.name || "Tên cấp độ";
  const experience = values.metaData.visitorExperience;
  const selectedStatus = publicationStatusOptions.find(
    (option) => option.value === values.status,
  );

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3.5">
        <div>
          <h2 className="text-sm font-semibold">Tóm tắt cấu hình</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Cập nhật theo dữ liệu đang chỉnh sửa
          </p>
        </div>
        <EditorStatus status={values.status} />
      </div>

      <div className="space-y-5 p-4">
        <div className="space-y-2">
          <Label htmlFor="monetization-status">Trạng thái</Label>
          <Select
            value={values.status}
            disabled={values.isDefault}
            onValueChange={(status: PublicationStatus) =>
              setValues((current) => ({ ...current, status }))
            }
          >
            <SelectTrigger id="monetization-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {publicationStatusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs leading-5 text-muted-foreground">
            {values.isDefault
              ? "Cấp độ mặc định luôn phải ở trạng thái xuất bản."
              : selectedStatus?.description}
          </p>
        </div>

        <Separator className="bg-border/60" />

        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Nhận diện
          </p>
          <div className="mt-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold">{name}</h3>
              <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                {values.key || "level-key"}
              </p>
            </div>
            {values.isDefault ? (
              <Badge variant="secondary">Mặc định</Badge>
            ) : null}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border/60">
          <div className="grid grid-cols-2 divide-x divide-border/60">
            <div className="p-3">
              <p className="text-[11px] text-muted-foreground">Lợi nhuận</p>
              <p className="mt-1 text-base font-semibold tabular-nums">
                {(values.metaData.profitBps / 100).toLocaleString("vi-VN", {
                  maximumFractionDigits: 2,
                })}
                %
              </p>
            </div>
            <div className="p-3">
              <p className="text-[11px] text-muted-foreground">Số page</p>
              <p className="mt-1 text-base font-semibold tabular-nums">
                {values.metaData.stepCount}
              </p>
            </div>
          </div>
          <Separator className="bg-border/60" />
          <div className="grid grid-cols-2 divide-x divide-border/60">
            <div className="p-3">
              <p className="text-[11px] text-muted-foreground">Routes</p>
              <p className="mt-1 text-base font-semibold tabular-nums">
                {values.routes.length}
              </p>
            </div>
            <div className="p-3">
              <p className="text-[11px] text-muted-foreground">Rates</p>
              <p className="mt-1 text-base font-semibold tabular-nums">
                {values.rates.length}
              </p>
            </div>
          </div>
        </div>

        <Separator className="bg-border/60" />

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Mật độ quảng cáo
          </p>
          <div className="mt-3 space-y-2.5">
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
    <div className="space-y-6">
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
          <div key={route.id} className="rounded-lg border border-border/60 bg-background/40 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <RouteIcon className="size-4 text-muted-foreground" />
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
            <div className="rounded-lg border border-border/60 bg-muted/15 p-4">
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
                    type="text"
                    inputMode="url"
                    value={route.targetUrl}
                    placeholder="http://localhost:3100/l/."
                    onChange={(event) =>
                      updateRoute(index, { targetUrl: event.target.value })
                    }
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Dùng <code>/.</code> ở cuối URL để thay bằng alias hiện tại.
                  </p>
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

function AdsFields({ values, setValues }: EditorSectionProps) {
  const addAd = (format: MonetizationAdFormat = "banner") =>
    setValues((current) => ({
      ...current,
      ads: [
        ...current.ads,
        newMonetizationAd(format, format === "smartlink" ? 100 : current.ads.length * 10),
      ],
    }));
  const updateAd = (index: number, patch: Partial<MonetizationAd>) =>
    setValues((current) => ({
      ...current,
      ads: current.ads.map((ad, adIndex) =>
        adIndex === index ? { ...ad, ...patch } : ad,
      ),
    }));
  const removeAd = (index: number) =>
    setValues((current) => ({
      ...current,
      ads: current.ads.filter((_, adIndex) => adIndex !== index),
    }));
  const duplicateAd = (index: number) =>
    setValues((current) => {
      const source = current.ads[index];
      if (!source) return current;
      const copy = structuredClone(source);
      copy.id = nextAdId();
      copy.name = `${source.name} (bản sao)`;
      copy.enabled = false;
      copy.content.smartlinks = copy.content.smartlinks?.map((smartlink) => ({
        ...smartlink,
        id: nextSmartlinkId(),
      }));
      return {
        ...current,
        ads: [...current.ads.slice(0, index + 1), copy, ...current.ads.slice(index + 1)],
      };
    });
  const smartlinks = values.ads.filter((ad) => ad.format === "smartlink");
  const hasUncappedSmartlinkFallback = smartlinks.some(
    (ad) =>
      ad.enabled &&
      ad.content.smartlinks?.some((smartlink) =>
        smartlink.enabled &&
        (smartlink.overrides?.maxRedirectsPerSession ?? ad.content.maxRedirectsPerSession ?? 0) === 0 &&
        (smartlink.overrides?.maxRedirectsPerVisitor ?? ad.content.maxRedirectsPerVisitor ?? 0) === 0 &&
        (smartlink.overrides?.cooldownMinutes ?? ad.content.cooldownMinutes ?? 0) === 0 &&
        !(smartlink.overrides?.startAt ?? ad.content.startAt) &&
        !(smartlink.overrides?.endAt ?? ad.content.endAt),
      ) &&
      ad.targeting.countries.includes("ALL") &&
      ad.targeting.devices.includes("any") &&
      ad.targeting.operatingSystems.includes("any") &&
      ad.targeting.browsers.includes("any"),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <SectionHeader
          title="Cấu hình quảng cáo"
          description="Smartlink, banner và script adapter được resolve cùng request visit; hệ thống không ghi log quảng cáo đã hiển thị."
        />
        <div className="flex flex-wrap gap-2"><Button type="button" size="sm" onClick={() => addAd("smartlink")}><Plus /> Thêm Smartlink</Button><Button type="button" size="sm" variant="outline" onClick={() => addAd("banner")}><Plus /> Thêm quảng cáo khác</Button></div>
      </div>
      <ConfigurationNotice
        healthy={
          values.ads.length === 0 ||
          values.ads.some(
            (ad) =>
              ad.enabled &&
              ad.targeting.countries.includes("ALL") &&
              ad.targeting.devices.includes("any") &&
              ad.targeting.operatingSystems.includes("any") &&
              ad.targeting.browsers.includes("any"),
          )
        }
        title={values.ads.length ? "Kiểm tra fallback quảng cáo" : "Chưa cấu hình quảng cáo"}
        description={
          values.ads.length
            ? "Nên có ít nhất một rule ALL + mọi thiết bị + mọi OS + mọi trình duyệt cho placement quan trọng."
            : "Level hoạt động bình thường và không hiển thị quảng cáo khi danh sách này trống."
        }
      />
      {smartlinks.length ? <ConfigurationNotice healthy={hasUncappedSmartlinkFallback} title={hasUncappedSmartlinkFallback ? "Đã có Smartlink fallback không giới hạn" : "Nên thêm Smartlink fallback"} description={hasUncappedSmartlinkFallback ? "Fallback giúp duy trì fill khi các campaign ưu tiên đã đạt cap, cooldown hoặc ngoài lịch chạy." : "Tạo một Smartlink priority thấp, targeting rộng, không cap/cooldown và không đặt lịch để tránh lúc không còn campaign hợp lệ."} /> : null}
      {values.ads.length ? (
        values.ads.map((ad, index) => (
          <AdManagerCard
            key={ad.id}
            ad={ad}
            index={index}
            onChange={(patch) => updateAd(index, patch)}
            onDuplicate={() => duplicateAd(index)}
            onDelete={() => removeAd(index)}
          />
        ))
      ) : (
        <EmptyConfiguration icon={Megaphone} title="Chưa có quảng cáo" description="Level này không chạy smartlink, banner hoặc script adapter." actionLabel="Thêm Smartlink đầu tiên" onAction={() => addAd("smartlink")} />
      )}
    </div>
  );
}

function AdManagerCard({ ad, index, onChange, onDuplicate, onDelete }: { ad: MonetizationAd; index: number; onChange: (patch: Partial<MonetizationAd>) => void; onDuplicate: () => void; onDelete: () => void }) {
  const updateContent = (patch: Partial<MonetizationAd["content"]>) => onChange({ content: { ...ad.content, ...patch } });
  const updateSmartlink = (smartlinkIndex: number, patch: Partial<MonetizationSmartlink>) => updateContent({ smartlinks: (ad.content.smartlinks ?? []).map((item, itemIndex) => itemIndex === smartlinkIndex ? { ...item, ...patch } : item) });
  const addSmartlink = () => updateContent({ smartlinks: [...(ad.content.smartlinks ?? []), newSmartlink((ad.content.smartlinks?.length ?? 0) * 10)] });
  const deleteSmartlink = (smartlinkIndex: number) => updateContent({ smartlinks: (ad.content.smartlinks ?? []).filter((_, itemIndex) => itemIndex !== smartlinkIndex) });
  const duplicateSmartlink = (smartlinkIndex: number) => {
    const source = ad.content.smartlinks?.[smartlinkIndex];
    if (!source) return;
    const copy = { ...structuredClone(source), id: nextSmartlinkId(), sortOrder: source.sortOrder + 1, enabled: false };
    updateContent({ smartlinks: [...(ad.content.smartlinks ?? []).slice(0, smartlinkIndex + 1), copy, ...(ad.content.smartlinks ?? []).slice(smartlinkIndex + 1)] });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-background/40">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-8 shrink-0 place-items-center text-muted-foreground">{ad.format === "banner" ? <ImageIcon className="size-4" /> : ad.format === "script" ? <Settings2 className="size-4" /> : <Link2 className="size-4" />}</span>
          <div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate text-sm font-semibold">{ad.name || "Chưa đặt tên"}</p><Badge variant={ad.enabled ? "default" : "secondary"}>{ad.enabled ? "Đang bật" : "Đã tắt"}</Badge></div><p className="truncate font-mono text-[11px] text-muted-foreground">{ad.id}</p></div>
        </div>
        <div className="flex items-center gap-2"><Switch checked={ad.enabled} aria-label={`Bật ${ad.name}`} onCheckedChange={(enabled) => onChange({ enabled })} /><Button type="button" variant="ghost" size="icon-sm" aria-label={`Nhân bản ${ad.name}`} onClick={onDuplicate}><Copy /></Button><Button type="button" variant="ghost" size="icon-sm" aria-label={`Xóa ${ad.name}`} onClick={onDelete}><Trash2 className="text-destructive" /></Button></div>
      </div>

      <div className="space-y-6 p-4 sm:p-5">
        <AdSection title="Thông tin quảng cáo" description="Thông tin chung và vị trí phân phối." icon={Megaphone}>
          <div className="grid gap-3 md:grid-cols-2"><FormField label="Tên" htmlFor={`ad-name-${index}`}><Input id={`ad-name-${index}`} maxLength={120} value={ad.name} onChange={(event) => onChange({ name: event.target.value })} /></FormField><FormField label="ID" htmlFor={`ad-id-${index}`}><Input id={`ad-id-${index}`} maxLength={64} value={ad.id} onChange={(event) => onChange({ id: event.target.value })} /></FormField><FormField label="Loại" htmlFor={`ad-format-${index}`}><Select value={ad.format} onValueChange={(format: MonetizationAdFormat) => onChange({ format, placements: defaultAdPlacements(format), content: defaultContent(format), weight: 100 })}><SelectTrigger id={`ad-format-${index}`}><SelectValue /></SelectTrigger><SelectContent>{adFormatOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></FormField><div className={ad.format === "smartlink" ? "" : "grid grid-cols-2 gap-3"}><FormField label="Priority" htmlFor={`ad-priority-${index}`}><Input id={`ad-priority-${index}`} type="number" min={0} max={10000} value={ad.priority} onChange={(event) => onChange({ priority: integerValue(event.target.value) })} /></FormField>{ad.format !== "smartlink" ? <FormField label="Weight" htmlFor={`ad-weight-${index}`}><Input id={`ad-weight-${index}`} type="number" min={1} max={100} value={ad.weight} onChange={(event) => onChange({ weight: integerValue(event.target.value) })} /></FormField> : null}</div></div>
          <div><Label>Placement</Label><OptionButtons className="mt-2" options={adPlacementOptions.filter((option) => ad.format === "smartlink" ? isSmartlinkPlacement(option.value) : !isSmartlinkPlacement(option.value))} values={ad.placements} onChange={(placements) => onChange({ placements: ad.format === "smartlink" ? (placements.length ? [placements[placements.length - 1]!] : ad.placements) : placements })} /></div>
          {ad.format === "smartlink" && ad.placements.includes("popunder") ? <ConfigurationNotice healthy title="Popunder theo tương tác đầu tiên" description="Mở Smartlink ở tab mới khi visitor click lần đầu, sau đó cố gắng giữ focus ở trang STU. Delay chuyển tab cũ chỉ áp dụng cho Unlock redirect; weight, cap, cooldown, lịch và targeting vẫn áp dụng đầy đủ." /> : null}
        </AdSection>

        {ad.format === "smartlink" ? <SmartlinkSection ad={ad} index={index} onAdd={addSmartlink} onUpdate={updateSmartlink} onDelete={deleteSmartlink} onDuplicate={duplicateSmartlink} /> : null}
        {ad.format === "banner" ? <AdSection title="Nội dung quảng cáo" description="Creative và trang đích của banner." icon={ImageIcon}><div className="grid gap-3 md:grid-cols-2"><FormField label="Image URL" htmlFor={`ad-image-${index}`}><Input id={`ad-image-${index}`} type="url" value={ad.content.imageUrl ?? ""} onChange={(event) => updateContent({ imageUrl: event.target.value })} /></FormField><FormField label="Click URL" htmlFor={`ad-click-${index}`}><Input id={`ad-click-${index}`} type="url" value={ad.content.clickUrl ?? ""} onChange={(event) => updateContent({ clickUrl: event.target.value })} /></FormField><FormField label="Tiêu đề" htmlFor={`ad-title-${index}`}><Input id={`ad-title-${index}`} value={ad.content.title ?? ""} onChange={(event) => updateContent({ title: event.target.value })} /></FormField><FormField label="CTA" htmlFor={`ad-cta-${index}`}><Input id={`ad-cta-${index}`} value={ad.content.ctaLabel ?? ""} onChange={(event) => updateContent({ ctaLabel: event.target.value })} /></FormField><div className="md:col-span-2"><FormField label="Mô tả" htmlFor={`ad-description-${index}`}><Textarea id={`ad-description-${index}`} rows={3} value={ad.content.description ?? ""} onChange={(event) => updateContent({ description: event.target.value })} /></FormField></div><label className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm"><span>Mở tab mới</span><Switch checked={Boolean(ad.content.newTab)} onCheckedChange={(newTab) => updateContent({ newTab })} /></label></div></AdSection> : null}
        {ad.format === "script" ? <AdSection title="Nội dung quảng cáo" description="Adapter và zone do frontend hiện hữu hỗ trợ." icon={Settings2}><div className="grid gap-3 md:grid-cols-3"><FormField label="Adapter" htmlFor={`ad-adapter-${index}`}><Input id={`ad-adapter-${index}`} value={ad.content.adapter ?? "external-script-v1"} onChange={(event) => updateContent({ adapter: event.target.value })} /></FormField><div className="md:col-span-2"><FormField label="Script URL" htmlFor={`ad-script-${index}`}><Input id={`ad-script-${index}`} type="url" value={ad.content.scriptUrl ?? ""} onChange={(event) => updateContent({ scriptUrl: event.target.value })} /></FormField></div><FormField label="Zone ID" htmlFor={`ad-zone-${index}`}><Input id={`ad-zone-${index}`} value={ad.content.zoneId ?? ""} onChange={(event) => updateContent({ zoneId: event.target.value })} /></FormField></div></AdSection> : null}

        {ad.format === "smartlink" ? <><AdSection title="Redirect / Frequency" description="Mặc định áp dụng cho mọi Smartlink chưa bật override." icon={Clock3}><div className="grid gap-3 sm:grid-cols-2"><FormField label="Chuyển tab cũ (giây)" htmlFor={`ad-delay-${index}`}><Input id={`ad-delay-${index}`} type="number" min={0} max={300} value={ad.content.redirectDelaySeconds ?? 5} onChange={(event) => updateContent({ redirectDelaySeconds: integerValue(event.target.value) })} /></FormField><FormField label="Cap mỗi phiên" htmlFor={`ad-session-cap-${index}`}><Input id={`ad-session-cap-${index}`} type="number" min={0} max={20} value={ad.content.maxRedirectsPerSession ?? 0} onChange={(event) => updateContent({ maxRedirectsPerSession: integerValue(event.target.value) })} /></FormField><FormField label="Cap mỗi visitor" htmlFor={`ad-visitor-cap-${index}`}><Input id={`ad-visitor-cap-${index}`} type="number" min={0} max={20} value={ad.content.maxRedirectsPerVisitor ?? 0} onChange={(event) => updateContent({ maxRedirectsPerVisitor: integerValue(event.target.value) })} /></FormField><FormField label="Cửa sổ cap (giờ)" htmlFor={`ad-window-${index}`}><Input id={`ad-window-${index}`} type="number" min={1} max={720} value={ad.content.frequencyWindowHours ?? 24} onChange={(event) => updateContent({ frequencyWindowHours: integerValue(event.target.value) })} /></FormField><FormField label="Cooldown (phút)" htmlFor={`ad-cooldown-${index}`}><Input id={`ad-cooldown-${index}`} type="number" min={0} max={10080} value={ad.content.cooldownMinutes ?? 0} onChange={(event) => updateContent({ cooldownMinutes: integerValue(event.target.value) })} /></FormField></div><p className="text-xs text-muted-foreground">0 nghĩa là không giới hạn. Candidate đạt cap/cooldown sẽ bị loại trước khi random.</p></AdSection><AdSection title="Lịch chạy" description="Khoảng thời gian mặc định của campaign." icon={CalendarClock}><div className="grid gap-3 md:grid-cols-2"><FormField label="Bắt đầu chạy" htmlFor={`ad-start-${index}`}><Input id={`ad-start-${index}`} type="datetime-local" value={toDateTimeLocal(ad.content.startAt)} onChange={(event) => updateContent({ startAt: fromDateTimeLocal(event.target.value) })} /></FormField><FormField label="Kết thúc chạy" htmlFor={`ad-end-${index}`}><Input id={`ad-end-${index}`} type="datetime-local" value={toDateTimeLocal(ad.content.endAt)} onChange={(event) => updateContent({ endAt: fromDateTimeLocal(event.target.value) })} /></FormField></div></AdSection></> : null}

        <TargetingSection ad={ad} onChange={onChange} />
      </div>
    </div>
  );
}

function AdSection({ title, description, icon: Icon, children }: { title: string; description: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return <section className="space-y-4 border-t border-border/60 pt-6 first:border-t-0 first:pt-0"><div className="flex items-start gap-3"><Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div><h4 className="text-sm font-semibold">{title}</h4><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div></div><div className="space-y-4">{children}</div></section>;
}

function SmartlinkSection({ ad, index, onAdd, onUpdate, onDelete, onDuplicate }: { ad: MonetizationAd; index: number; onAdd: () => void; onUpdate: (index: number, patch: Partial<MonetizationSmartlink>) => void; onDelete: (index: number) => void; onDuplicate: (index: number) => void }) {
  const smartlinks = ad.content.smartlinks ?? [];
  return <AdSection title="Smartlink" description="Random theo weight sau khi loại link tắt, hết cap hoặc ngoài lịch." icon={Link2}><div className="flex items-center justify-between gap-3"><p className="text-xs text-muted-foreground">{smartlinks.filter((item) => item.enabled).length}/{smartlinks.length} link đang bật</p><Button type="button" size="sm" variant="outline" onClick={onAdd}><Plus /> Add Smartlink</Button></div>{smartlinks.length ? <div className="space-y-2">{smartlinks.map((smartlink, smartlinkIndex) => <SmartlinkRow key={smartlink.id} campaign={ad} campaignIndex={index} smartlink={smartlink} index={smartlinkIndex} share={estimatedSmartlinkShare(smartlinks, smartlink)} onChange={(patch) => onUpdate(smartlinkIndex, patch)} onDelete={() => onDelete(smartlinkIndex)} onDuplicate={() => onDuplicate(smartlinkIndex)} />)}</div> : <div className="rounded-md border border-dashed p-5 text-center text-sm text-muted-foreground">Chưa có Smartlink. Thêm ít nhất một URL để campaign có thể phân phối.</div>}</AdSection>;
}

function SmartlinkRow({ campaign, campaignIndex, smartlink, index, share, onChange, onDelete, onDuplicate }: { campaign: MonetizationAd; campaignIndex: number; smartlink: MonetizationSmartlink; index: number; share: number; onChange: (patch: Partial<MonetizationSmartlink>) => void; onDelete: () => void; onDuplicate: () => void }) {
  const hasOverride = Boolean(smartlink.overrides);
  const setOverride = (patch: Partial<MonetizationSmartlinkOverrides>) => onChange({ overrides: { ...smartlink.overrides, ...patch } });
  return (
    <div className="rounded-lg border border-border/60 bg-background p-3">
      <div className="grid items-end gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormField
            label="URL"
            htmlFor={`smartlink-url-${campaignIndex}-${index}`}
          >
            <div className="flex items-center gap-2">
              <GripVertical className="size-4 shrink-0 text-muted-foreground" />
              <Input
                id={`smartlink-url-${campaignIndex}-${index}`}
                type="url"
                value={smartlink.url}
                placeholder="https://provider.example/smartlink"
                onChange={(event) => onChange({ url: event.target.value })}
              />
            </div>
          </FormField>
        </div>
        <FormField
          label="Weight"
          htmlFor={`smartlink-weight-${campaignIndex}-${index}`}
        >
          <Input
            id={`smartlink-weight-${campaignIndex}-${index}`}
            type="number"
            min={1}
            max={100}
            value={smartlink.weight}
            onChange={(event) =>
              onChange({ weight: integerValue(event.target.value) })
            }
          />
        </FormField>
        <FormField
          label="Thứ tự"
          htmlFor={`smartlink-order-${campaignIndex}-${index}`}
        >
          <Input
            id={`smartlink-order-${campaignIndex}-${index}`}
            type="number"
            min={0}
            max={10000}
            value={smartlink.sortOrder}
            onChange={(event) =>
              onChange({ sortOrder: integerValue(event.target.value) })
            }
          />
        </FormField>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-mono text-[10px] text-muted-foreground">
            {smartlink.id}
          </span>
          <Badge variant="outline">≈ {share}%</Badge>
        </div>
        <div className="flex items-center gap-1">
          <Switch
            checked={smartlink.enabled}
            aria-label={`Bật ${smartlink.id}`}
            onCheckedChange={(enabled) => onChange({ enabled })}
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 text-xs"
            onClick={() =>
              onChange({ overrides: hasOverride ? undefined : {} })
            }
          >
            {hasOverride ? "Tắt config override" : "Config override"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Nhân bản Smartlink"
            onClick={onDuplicate}
          >
            <Copy />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Xóa Smartlink"
            onClick={onDelete}
          >
            <Trash2 className="text-destructive" />
          </Button>
        </div>
      </div>

      {hasOverride ? (
        <div className="mt-3 grid gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 sm:grid-cols-2">
          <FormField
            label={`Delay (mặc định ${campaign.content.redirectDelaySeconds ?? 5}s)`}
            htmlFor={`sl-delay-${campaignIndex}-${index}`}
          >
            <Input
              id={`sl-delay-${campaignIndex}-${index}`}
              type="number"
              min={0}
              max={300}
              value={smartlink.overrides?.redirectDelaySeconds ?? ""}
              placeholder={String(campaign.content.redirectDelaySeconds ?? 5)}
              onChange={(event) =>
                setOverride({
                  redirectDelaySeconds:
                    event.target.value === ""
                      ? undefined
                      : integerValue(event.target.value),
                })
              }
            />
          </FormField>
          <FormField
            label="Cap phiên"
            htmlFor={`sl-session-${campaignIndex}-${index}`}
          >
            <Input
              id={`sl-session-${campaignIndex}-${index}`}
              type="number"
              min={0}
              max={20}
              value={smartlink.overrides?.maxRedirectsPerSession ?? ""}
              placeholder={String(campaign.content.maxRedirectsPerSession ?? 0)}
              onChange={(event) =>
                setOverride({
                  maxRedirectsPerSession:
                    event.target.value === ""
                      ? undefined
                      : integerValue(event.target.value),
                })
              }
            />
          </FormField>
          <FormField
            label="Cap visitor"
            htmlFor={`sl-visitor-${campaignIndex}-${index}`}
          >
            <Input
              id={`sl-visitor-${campaignIndex}-${index}`}
              type="number"
              min={0}
              max={20}
              value={smartlink.overrides?.maxRedirectsPerVisitor ?? ""}
              placeholder={String(campaign.content.maxRedirectsPerVisitor ?? 0)}
              onChange={(event) =>
                setOverride({
                  maxRedirectsPerVisitor:
                    event.target.value === ""
                      ? undefined
                      : integerValue(event.target.value),
                })
              }
            />
          </FormField>
          <FormField
            label="Cửa sổ (giờ)"
            htmlFor={`sl-window-${campaignIndex}-${index}`}
          >
            <Input
              id={`sl-window-${campaignIndex}-${index}`}
              type="number"
              min={1}
              max={720}
              value={smartlink.overrides?.frequencyWindowHours ?? ""}
              placeholder={String(campaign.content.frequencyWindowHours ?? 24)}
              onChange={(event) =>
                setOverride({
                  frequencyWindowHours:
                    event.target.value === ""
                      ? undefined
                      : integerValue(event.target.value),
                })
              }
            />
          </FormField>
          <FormField
            label="Cooldown (phút)"
            htmlFor={`sl-cooldown-${campaignIndex}-${index}`}
          >
            <Input
              id={`sl-cooldown-${campaignIndex}-${index}`}
              type="number"
              min={0}
              max={10080}
              value={smartlink.overrides?.cooldownMinutes ?? ""}
              placeholder={String(campaign.content.cooldownMinutes ?? 0)}
              onChange={(event) =>
                setOverride({
                  cooldownMinutes:
                    event.target.value === ""
                      ? undefined
                      : integerValue(event.target.value),
                })
              }
            />
          </FormField>
          <FormField
            label="Bắt đầu"
            htmlFor={`sl-start-${campaignIndex}-${index}`}
          >
            <Input
              id={`sl-start-${campaignIndex}-${index}`}
              type="datetime-local"
              value={toDateTimeLocal(smartlink.overrides?.startAt)}
              onChange={(event) =>
                setOverride({ startAt: fromDateTimeLocal(event.target.value) })
              }
            />
          </FormField>
          <FormField
            label="Kết thúc"
            htmlFor={`sl-end-${campaignIndex}-${index}`}
          >
            <Input
              id={`sl-end-${campaignIndex}-${index}`}
              type="datetime-local"
              value={toDateTimeLocal(smartlink.overrides?.endAt)}
              onChange={(event) =>
                setOverride({ endAt: fromDateTimeLocal(event.target.value) })
              }
            />
          </FormField>
        </div>
      ) : null}
    </div>
  );
}

function TargetingSection({ ad, onChange }: { ad: MonetizationAd; onChange: (patch: Partial<MonetizationAd>) => void }) {
  const targetCount = [ad.targeting.countries, ad.targeting.devices, ad.targeting.operatingSystems, ad.targeting.browsers, ad.targeting.deliveryModes, ad.targeting.niches, ad.targeting.siteKeys, ad.targeting.postTypes, ad.targeting.categoryIds, ad.targeting.locales].filter((items) => items.length > 0).length;
  return <Collapsible className="group rounded-lg border bg-muted/10"><CollapsibleTrigger asChild><Button type="button" variant="ghost" className="h-auto w-full justify-between rounded-lg px-3 py-2.5"><span className="flex items-center gap-2 text-left"><MonitorSmartphone className="size-4 text-muted-foreground" /><span><span className="block text-sm font-medium">Targeting</span><span className="block text-[11px] font-normal text-muted-foreground">Đang cấu hình {targetCount} nhóm điều kiện · mặc định thu gọn</span></span></span><ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" /></Button></CollapsibleTrigger><CollapsibleContent><div className="space-y-3 border-t p-3"><p className="text-xs text-muted-foreground">Các nhóm điều kiện phải đồng thời khớp. Để trống hoặc chọn “mọi” để dùng wildcard.</p><div className="grid gap-3 md:grid-cols-2"><CsvField label="Quốc gia" value={ad.targeting.countries} placeholder="ALL hoặc VN, US" onChange={(countries) => onChange({ targeting: { ...ad.targeting, countries: countries.map((value) => value.toUpperCase()) } })} /><CsvField label="Ngách" value={ad.targeting.niches} placeholder="any, game, download" onChange={(niches) => onChange({ targeting: { ...ad.targeting, niches } })} /><CsvField label="Site keys" value={ad.targeting.siteKeys} placeholder="wordpress-main" onChange={(siteKeys) => onChange({ targeting: { ...ad.targeting, siteKeys } })} /><CsvField label="Post types" value={ad.targeting.postTypes} placeholder="post, page" onChange={(postTypes) => onChange({ targeting: { ...ad.targeting, postTypes } })} /><CsvField label="Category IDs" value={ad.targeting.categoryIds.map(String)} placeholder="2, 5" onChange={(items) => onChange({ targeting: { ...ad.targeting, categoryIds: items.map(Number).filter((value) => Number.isInteger(value) && value > 0) } })} /><CsvField label="Locale" value={ad.targeting.locales} placeholder="vi, en-US" onChange={(locales) => onChange({ targeting: { ...ad.targeting, locales } })} /></div><TargetOptionGroup label="Thiết bị" options={deviceOptions} values={ad.targeting.devices} onChange={(devices) => onChange({ targeting: { ...ad.targeting, devices } })} /><TargetOptionGroup label="Kiểu hiển thị WordPress" options={deliveryModeOptions} values={ad.targeting.deliveryModes} onChange={(deliveryModes) => onChange({ targeting: { ...ad.targeting, deliveryModes } })} /><TargetOptionGroup label="Hệ điều hành" options={operatingSystemOptions} values={ad.targeting.operatingSystems} onChange={(operatingSystems) => onChange({ targeting: { ...ad.targeting, operatingSystems } })} /><TargetOptionGroup label="Trình duyệt" options={browserOptions} values={ad.targeting.browsers} onChange={(browsers) => onChange({ targeting: { ...ad.targeting, browsers } })} /></div></CollapsibleContent></Collapsible>;
}

function OptionButtons<T extends string>({ options, values, onChange, className = "" }: { options: Array<{ value: T; label: string }>; values: T[]; onChange: (values: T[]) => void; className?: string }) {
  return <div className={`flex flex-wrap gap-2 ${className}`}>{options.map((option) => { const active = values.includes(option.value); return <Button key={option.value} type="button" size="sm" variant={active ? "default" : "outline"} onClick={() => onChange(active ? values.filter((value) => value !== option.value) : [...values, option.value])}>{option.label}</Button>; })}</div>;
}

function TargetOptionGroup<T extends string>({ label, options, values, onChange }: { label: string; options: Array<{ value: T; label: string }>; values: T[]; onChange: (values: T[]) => void }) {
  return <div><Label>{label}</Label><OptionButtons className="mt-2" options={options} values={values} onChange={onChange} /></div>;
}

function CsvField({ label, value, placeholder, onChange }: { label: string; value: string[]; placeholder: string; onChange: (value: string[]) => void }) {
  const id = React.useId();
  return <FormField label={label} htmlFor={id}><Input id={id} value={value.join(", ")} placeholder={placeholder} onChange={(event) => onChange(event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} /></FormField>;
}

function defaultContent(format: MonetizationAdFormat): MonetizationAd["content"] {
  if (format === "smartlink") return { smartlinks: [newSmartlink(0)], redirectDelaySeconds: 5, maxRedirectsPerSession: 2, maxRedirectsPerVisitor: 4, frequencyWindowHours: 24, cooldownMinutes: 10 };
  if (format === "script") return { adapter: "external-script-v1", scriptUrl: "https://", zoneId: "" };
  return { imageUrl: "https://", clickUrl: "https://", ctaLabel: "Tìm hiểu thêm", newTab: true };
}

function newMonetizationAd(format: MonetizationAdFormat, priority: number): MonetizationAd {
  return {
    id: nextAdId(),
    name: format === "smartlink" ? "Smartlink mới" : "Quảng cáo mới",
    enabled: true,
    format,
    placements: defaultAdPlacements(format),
    priority,
    weight: 100,
    targeting: {
      countries: ["ALL"],
      devices: ["any"],
      operatingSystems: ["any"],
      browsers: ["any"],
      deliveryModes: ["any"],
      niches: ["any"],
      siteKeys: [],
      postTypes: [],
      categoryIds: [],
      locales: [],
    },
    content: defaultContent(format),
  };
}

function newSmartlink(sortOrder: number): MonetizationSmartlink {
  return { id: nextSmartlinkId(), url: "https://", enabled: true, weight: 100, sortOrder };
}

function estimatedSmartlinkShare(smartlinks: MonetizationSmartlink[], current: MonetizationSmartlink) {
  if (!current.enabled) return 0;
  const total = smartlinks.filter((item) => item.enabled).reduce((sum, item) => sum + Math.max(1, item.weight), 0);
  return total > 0 ? Math.round(Math.max(1, current.weight) / total * 100) : 0;
}

function toDateTimeLocal(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function fromDateTimeLocal(value: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function defaultAdPlacements(format: MonetizationAdFormat): MonetizationAdPlacement[] {
  return format === "smartlink" ? ["unlock_redirect"] : ["safe_overlay_top"];
}

function isSmartlinkPlacement(
  value: string | undefined,
): value is "unlock_redirect" | "popunder" {
  return value === "unlock_redirect" || value === "popunder";
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
    <div className="min-w-0 rounded-lg border border-border/60 bg-background p-3">
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
    <div className="space-y-6">
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
          <div key={`rate-${index}`} className="rounded-lg border border-border/60 bg-background/40 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <WalletCards className="size-4 text-muted-foreground" />
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
            <div className="grid gap-4 sm:grid-cols-2">
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
  description,
  value,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  value: MonetizationAdDensity;
  onChange: (value: MonetizationAdDensity) => void;
}) {
  return (
    <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <Label className="text-sm font-medium">{label}</Label>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full shrink-0 rounded-lg sm:w-[220px]">
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
      <h3 className="text-base font-semibold tracking-[-0.01em]">{title}</h3>
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
      ads: structuredClone(level.ads ?? []).map((ad) => {
        const normalizedSmartlinks = ad.format === "smartlink"
          ? (ad.content.smartlinks ?? (ad.content.targetUrl
              ? [{ id: nextSmartlinkId(), url: ad.content.targetUrl, enabled: true, weight: ad.weight, sortOrder: 0 }]
              : [])).map((smartlink, index) => ({
                ...smartlink,
                sortOrder: smartlink.sortOrder ?? index * 10,
              }))
          : undefined;
        const content = { ...ad.content };
        delete content.targetUrl;
        return {
          ...ad,
          placements: ad.format === "smartlink"
            ? [ad.placements.find(isSmartlinkPlacement) ?? "unlock_redirect"]
            : (ad.placements.filter((placement) => !isSmartlinkPlacement(placement)).length
                ? ad.placements.filter((placement) => !isSmartlinkPlacement(placement))
                : ["safe_overlay_top"]),
          targeting: {
            ...ad.targeting,
            deliveryModes: ad.targeting.deliveryModes ?? ["any"],
          },
          content: {
            ...content,
            ...(ad.format === "smartlink"
              ? {
                  smartlinks: normalizedSmartlinks,
                  redirectDelaySeconds: ad.content.redirectDelaySeconds ?? 5,
                  maxRedirectsPerSession: ad.content.maxRedirectsPerSession ?? 0,
                  maxRedirectsPerVisitor: ad.content.maxRedirectsPerVisitor ?? 0,
                  frequencyWindowHours: ad.content.frequencyWindowHours ?? 24,
                  cooldownMinutes: ad.content.cooldownMinutes ?? 0,
                }
              : {}),
          },
        };
      }),
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
    ads: [],
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
    return { tab: "show", message: "Số page phải nằm trong khoảng 1–20." };
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
  const adIds = values.ads.map((ad) => ad.id);
  if (new Set(adIds).size !== adIds.length) {
    return { tab: "ads", message: "ID quảng cáo không được trùng nhau." };
  }
  const smartlinkIds = values.ads.flatMap((ad) => ad.content.smartlinks?.map((smartlink) => smartlink.id) ?? []);
  const deliveryIds = [...adIds, ...smartlinkIds];
  if (new Set(deliveryIds).size !== deliveryIds.length) {
    return { tab: "ads", message: "ID quảng cáo và Smartlink không được trùng nhau." };
  }
  for (const ad of values.ads) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(ad.id)) {
      return { tab: "ads", message: `ID quảng cáo “${ad.id}” không hợp lệ.` };
    }
    if (!ad.name.trim() || ad.placements.length === 0) {
      return { tab: "ads", message: `Quảng cáo “${ad.id}” cần tên và ít nhất một placement.` };
    }
    if (ad.priority < 0 || ad.priority > 10_000 || ad.weight < 1 || ad.weight > 100) {
      return { tab: "ads", message: `Priority hoặc weight của “${ad.id}” không hợp lệ.` };
    }
    if (ad.targeting.countries.some((country) => !/^(?:[A-Z]{2}|ALL|ZZ)$/.test(country))) {
      return { tab: "ads", message: `Country targeting của “${ad.id}” không hợp lệ.` };
    }
    if (ad.format === "smartlink" && (ad.placements.length !== 1 || !isSmartlinkPlacement(ad.placements[0]))) {
      return { tab: "ads", message: `Smartlink “${ad.id}” phải chọn đúng một placement: Unlock redirect hoặc Popunder.` };
    }
    if (ad.format === "smartlink" && !ad.content.smartlinks?.length) {
      return { tab: "ads", message: `Campaign “${ad.id}” cần ít nhất một Smartlink.` };
    }
    for (const smartlink of ad.format === "smartlink" ? ad.content.smartlinks ?? [] : []) {
      if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(smartlink.id)) {
        return { tab: "ads", message: `ID Smartlink “${smartlink.id}” không hợp lệ.` };
      }
      if (!/^https?:\/\/.+/i.test(smartlink.url)) {
        return { tab: "ads", message: `URL của Smartlink “${smartlink.id}” không hợp lệ.` };
      }
      if (smartlink.weight < 1 || smartlink.weight > 100 || smartlink.sortOrder < 0 || smartlink.sortOrder > 10_000) {
        return { tab: "ads", message: `Weight hoặc thứ tự của Smartlink “${smartlink.id}” không hợp lệ.` };
      }
      const override = smartlink.overrides;
      if (override && ((override.redirectDelaySeconds ?? 0) < 0 || (override.redirectDelaySeconds ?? 0) > 300 || (override.maxRedirectsPerSession ?? 0) < 0 || (override.maxRedirectsPerSession ?? 0) > 20 || (override.maxRedirectsPerVisitor ?? 0) < 0 || (override.maxRedirectsPerVisitor ?? 0) > 20)) {
        return { tab: "ads", message: `Config override của Smartlink “${smartlink.id}” vượt giới hạn.` };
      }
      if (override && ((override.frequencyWindowHours ?? 24) < 1 || (override.frequencyWindowHours ?? 24) > 720 || (override.cooldownMinutes ?? 0) < 0 || (override.cooldownMinutes ?? 0) > 10_080)) {
        return { tab: "ads", message: `Cửa sổ cap hoặc cooldown override của Smartlink “${smartlink.id}” không hợp lệ.` };
      }
      if (override?.startAt && override.endAt && Date.parse(override.endAt) <= Date.parse(override.startAt)) {
        return { tab: "ads", message: `Smartlink “${smartlink.id}” cần thời gian kết thúc sau thời gian bắt đầu.` };
      }
    }
    if (ad.format === "smartlink" && ((ad.content.redirectDelaySeconds ?? 5) < 0 || (ad.content.redirectDelaySeconds ?? 5) > 300)) {
      return { tab: "ads", message: `Thời gian chờ của Smartlink “${ad.id}” phải từ 0–300 giây.` };
    }
    if (ad.format === "smartlink" && ((ad.content.maxRedirectsPerSession ?? 0) < 0 || (ad.content.maxRedirectsPerSession ?? 0) > 20 || (ad.content.maxRedirectsPerVisitor ?? 0) < 0 || (ad.content.maxRedirectsPerVisitor ?? 0) > 20)) {
      return { tab: "ads", message: `Frequency cap của Smartlink “${ad.id}” phải từ 0–20.` };
    }
    if (ad.format === "smartlink" && ((ad.content.frequencyWindowHours ?? 24) < 1 || (ad.content.frequencyWindowHours ?? 24) > 720 || (ad.content.cooldownMinutes ?? 0) < 0 || (ad.content.cooldownMinutes ?? 0) > 10_080)) {
      return { tab: "ads", message: `Cửa sổ cap hoặc cooldown của Smartlink “${ad.id}” không hợp lệ.` };
    }
    if (ad.format === "smartlink" && ad.content.startAt && ad.content.endAt && Date.parse(ad.content.endAt) <= Date.parse(ad.content.startAt)) {
      return { tab: "ads", message: `Smartlink “${ad.id}” cần thời gian kết thúc sau thời gian bắt đầu.` };
    }
    if (ad.format !== "smartlink" && ad.placements.some(isSmartlinkPlacement)) {
      return { tab: "ads", message: `Unlock redirect và Popunder chỉ dành cho Smartlink.` };
    }
    if (ad.format === "banner" && (!/^https?:\/\/.+/i.test(ad.content.imageUrl ?? "") || !/^https?:\/\/.+/i.test(ad.content.clickUrl ?? ""))) {
      return { tab: "ads", message: `Banner “${ad.id}” cần Image URL và Click URL hợp lệ.` };
    }
    if (ad.format === "script" && (!ad.content.adapter || !/^https?:\/\/.+/i.test(ad.content.scriptUrl ?? ""))) {
      return { tab: "ads", message: `Script “${ad.id}” cần adapter và Script URL hợp lệ.` };
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

function splitActionCounts(actionCount: number, requestedPageCount: number) {
  const pages = Math.max(1, Math.min(requestedPageCount, Math.max(1, actionCount)));
  const baseSize = Math.floor(actionCount / pages);
  const remainder = actionCount % pages;
  return Array.from({ length: pages }, (_, index) => baseSize + (index < remainder ? 1 : 0));
}

function nextRouteId() {
  return `route-${globalThis.crypto?.randomUUID?.().slice(0, 8) ?? Date.now()}`;
}

function nextAdId() {
  return `ad-${globalThis.crypto?.randomUUID?.().slice(0, 8) ?? Date.now()}`;
}

function nextSmartlinkId() {
  return `sl-${globalThis.crypto?.randomUUID?.().slice(0, 8) ?? Date.now()}`;
}
