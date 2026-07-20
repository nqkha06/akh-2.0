"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronsUpDown,
  Languages,
  LoaderCircle,
  Save,
} from "lucide-react";
import { toast } from "sonner";

import { PublicationStatusCard } from "@/components/admin/publication-status-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  createLanguage,
  getAdminLanguage,
  getAdminLanguages,
  updateLanguage,
} from "../api/languages.client";
import { countryFlag } from "./admin-languages-page";
import {
  languageCatalog,
  type LanguagePreset,
} from "../language-catalog";
import type { LanguagePayload } from "../types";
import type { PublicationStatus } from "@/types/publication-status";

const emptyLanguage: LanguagePayload = {
  name: "",
  nativeName: "",
  locale: "",
  code: "",
  regional: "",
  flag: "",
  isDefault: false,
  status: "draft",
  sortOrder: 10,
  isRtl: false,
};

export function LanguageEditorPage({
  languageId,
}: {
  languageId?: number;
}) {
  const router = useRouter();
  const editing = languageId !== undefined;
  const [form, setForm] = React.useState<LanguagePayload>(emptyLanguage);
  const [existingLocales, setExistingLocales] = React.useState<string[]>([]);
  const [selectorOpen, setSelectorOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let active = true;
    void Promise.all([
      getAdminLanguages(),
      languageId ? getAdminLanguage(languageId) : Promise.resolve(null),
    ])
      .then(([languages, language]) => {
        if (!active) return;
        setExistingLocales(languages.items.map(({ locale }) => locale));
        if (language) {
          setForm({ ...language });
        } else {
          setForm({
            ...emptyLanguage,
            sortOrder: languages.items.length
              ? Math.max(...languages.items.map(({ sortOrder }) => sortOrder)) +
                10
              : 10,
          });
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Không thể tải dữ liệu ngôn ngữ.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [languageId]);

  function selectPreset(preset: LanguagePreset) {
    setForm((current) => ({
      ...current,
      name: preset.name,
      nativeName: preset.nativeName,
      locale: preset.locale,
      code: preset.code,
      regional: preset.regional,
      flag: preset.flag,
      isRtl: preset.isRtl,
    }));
    setSelectorOpen(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.locale || !form.name.trim()) {
      setError("Hãy chọn ngôn ngữ và nhập tên hiển thị.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (languageId) await updateLanguage(languageId, form);
      else await createLanguage(form);
      toast.success(
        editing ? "Đã cập nhật ngôn ngữ." : "Đã thêm ngôn ngữ.",
      );
      router.push("/admin/languages");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Không thể lưu ngôn ngữ.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex min-h-72 w-full max-w-[1240px] items-center justify-center gap-2 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" />
        Đang tải ngôn ngữ...
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 pb-8">
      <AdminPageHeader
        title={editing ? "Chỉnh sửa ngôn ngữ" : "Thêm ngôn ngữ"}
        description="Chọn từ catalog để hệ thống tự cấu hình locale, quốc kỳ và hướng hiển thị."
        leading={
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => router.push("/admin/languages")}
          >
            <ArrowLeft />
          </Button>
        }
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => router.push("/admin/languages")}
            >
              Hủy
            </Button>
            <Button form="language-editor-form" type="submit" disabled={saving}>
              {saving ? <LoaderCircle className="animate-spin" /> : <Save />}
              {saving ? "Đang lưu..." : "Lưu ngôn ngữ"}
            </Button>
          </>
        }
      />

      {error ? (
        <Alert variant="destructive">
          <Languages />
          <AlertTitle>Không thể lưu thay đổi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form
        id="language-editor-form"
        onSubmit={submit}
        className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.78fr)]"
      >
        <div className="flex flex-col gap-6">
          <SectionCard
            title="Thông tin ngôn ngữ"
            description="Chọn ngôn ngữ và điều chỉnh tên hiển thị khi cần."
          >
            <div className="space-y-2">
              <Label>Ngôn ngữ</Label>
              <Popover open={selectorOpen} onOpenChange={setSelectorOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    disabled={editing}
                    className="h-11 w-full justify-between font-normal"
                  >
                    {form.locale ? (
                      <span className="flex items-center gap-3">
                        <span className="text-xl">
                          {countryFlag(form.flag)}
                        </span>
                        <span>
                          {form.nativeName || form.name} · {form.locale}
                        </span>
                      </span>
                    ) : (
                      "Tìm và chọn ngôn ngữ..."
                    )}
                    <ChevronsUpDown className="opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="w-[var(--radix-popover-trigger-width)] p-0"
                >
                  <Command>
                    <CommandInput placeholder="Tên, locale hoặc regional..." />
                    <CommandList>
                      <CommandEmpty>Không tìm thấy ngôn ngữ.</CommandEmpty>
                      <CommandGroup>
                        {languageCatalog.map((preset) => {
                          const unavailable =
                            existingLocales.includes(preset.locale) &&
                            preset.locale !== form.locale;
                          return (
                            <CommandItem
                              key={preset.locale}
                              value={`${preset.name} ${preset.nativeName} ${preset.locale} ${preset.regional}`}
                              disabled={unavailable}
                              onSelect={() => selectPreset(preset)}
                            >
                              <span className="text-lg">
                                {countryFlag(preset.flag)}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium">
                                  {preset.nativeName}
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {preset.name} · {preset.locale}
                                </span>
                              </span>
                              {form.locale === preset.locale ? <Check /> : null}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {editing ? (
                <p className="text-xs leading-5 text-muted-foreground">
                  Locale được khóa vì đang là khóa liên kết của các bản dịch.
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                id="language-name"
                label="Tên quản trị"
                value={form.name}
                onChange={(name) =>
                  setForm((current) => ({ ...current, name }))
                }
              />
              <Field
                id="language-native-name"
                label="Tên bản địa"
                value={form.nativeName || ""}
                onChange={(nativeName) =>
                  setForm((current) => ({ ...current, nativeName }))
                }
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Cấu hình kỹ thuật"
            description="Các giá trị này được điền tự động từ lựa chọn phía trên."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <TechnicalValue label="Locale" value={form.locale || "—"} />
              <TechnicalValue label="Code" value={form.code || "—"} />
              <TechnicalValue
                label="Regional"
                value={form.regional || "—"}
              />
              <TechnicalValue
                label="Direction"
                value={form.isRtl ? "RTL" : "LTR"}
              />
            </div>
          </SectionCard>
        </div>

        <aside className="flex flex-col gap-6">
          <PublicationStatusCard
            id="language-status"
            status={form.status}
            disabled={form.isDefault}
            disabledReason="Ngôn ngữ mặc định luôn phải ở trạng thái xuất bản."
            onStatusChange={(status: PublicationStatus) =>
              setForm((current) => ({ ...current, status }))
            }
          />

          <SectionCard
            title="Ngôn ngữ mặc định"
            description="Bản dịch của locale mặc định sẽ là bắt buộc."
          >
            <ToggleField
              label="Ngôn ngữ mặc định"
              description="Bản dịch của locale này sẽ là bắt buộc."
              checked={form.isDefault}
              onChange={(isDefault) =>
                setForm((current) => ({
                  ...current,
                  isDefault,
                  status: isDefault ? "published" : current.status,
                }))
              }
            />
          </SectionCard>

          <SectionCard
            title="Sắp xếp"
            description="Thứ tự hiển thị trong các bộ chọn ngôn ngữ."
          >
            <div className="space-y-2">
              <Label htmlFor="language-sort-order">Thứ tự</Label>
              <Input
                id="language-sort-order"
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sortOrder: Number(event.target.value) || 0,
                  }))
                }
              />
            </div>
          </SectionCard>
        </aside>
      </form>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-0 rounded-2xl py-0 shadow-none">
      <CardHeader className="border-b px-6 py-5">
        <h2 className="font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </CardHeader>
      <CardContent className="space-y-5 px-6 py-6">{children}</CardContent>
    </Card>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function TechnicalValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-muted/20 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-sm font-medium">{value}</p>
    </div>
  );
}

function ToggleField({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 rounded-xl border p-4">
      <Checkbox
        className="mt-0.5"
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onChange(value === true)}
      />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  );
}
