"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronsUpDown,
  Languages,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";

import {
  createLanguage,
  deleteLanguage,
  getAdminLanguages,
  reorderLanguages,
  setDefaultLanguage,
  updateLanguage,
} from "../api/languages.client";
import type { Language, LanguagePayload } from "../types";
import {
  languageCatalog,
  type LanguagePreset,
} from "../language-catalog";

const emptyLanguage: LanguagePayload = {
  name: "",
  nativeName: "",
  locale: "",
  code: "",
  regional: "",
  flag: "",
  isDefault: false,
  isEnabled: true,
  sortOrder: 0,
  isRtl: false,
};

export function AdminLanguagesPage() {
  const permissions = useAdminPermissions();
  const canCreate = permissions.includes("languages.create");
  const canUpdate = permissions.includes("languages.update");
  const canDelete = permissions.includes("languages.delete");
  const [items, setItems] = React.useState<Language[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Language | null>(null);
  const [deleting, setDeleting] = React.useState<Language | null>(null);
  const [busyId, setBusyId] = React.useState<number | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems((await getAdminLanguages()).items);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải ngôn ngữ.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function mutate(
    language: Language,
    action: () => Promise<unknown>,
    success: string,
  ) {
    setBusyId(language.id);
    try {
      await action();
      toast.success(success);
      await load();
    } catch (mutationError) {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : "Không thể cập nhật ngôn ngữ.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function move(language: Language, direction: -1 | 1) {
    const index = items.findIndex(({ id }) => id === language.id);
    const target = items[index + direction];
    if (!target) return;
    await mutate(
      language,
      () =>
        reorderLanguages([
          { id: language.id, sortOrder: target.sortOrder },
          { id: target.id, sortOrder: language.sortOrder },
        ]),
      "Đã cập nhật thứ tự.",
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold">Danh mục locale</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Language điều khiển các bản dịch nội dung trong database. Message
            giao diện Next.js vẫn được quản lý bằng file.
          </p>
        </div>
        {canCreate ? (
          <Button
            onClick={() => {
              setEditing(null);
              setEditorOpen(true);
            }}
          >
            <Plus />
            Thêm ngôn ngữ
          </Button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        {loading ? (
          <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            Đang tải...
          </div>
        ) : error ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 p-6">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={() => void load()}>
              <RefreshCw />
              Thử lại
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center p-6 text-center">
            <Languages className="size-8 text-muted-foreground" />
            <p className="mt-3 font-medium">Chưa có ngôn ngữ</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ngôn ngữ</TableHead>
                <TableHead>Locale</TableHead>
                <TableHead>Hướng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thứ tự</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((language, index) => (
                <TableRow key={language.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">
                        {countryFlag(language.flag)}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 font-medium">
                          {language.nativeName || language.name}
                          {language.isDefault ? (
                            <Badge variant="secondary">
                              <Star />
                              Mặc định
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {language.name}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs">{language.locale}</code>
                    {language.regional ? (
                      <p className="text-xs text-muted-foreground">
                        {language.regional}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell>{language.isRtl ? "RTL" : "LTR"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={language.isEnabled ? "secondary" : "outline"}
                    >
                      {language.isEnabled ? "Đang bật" : "Đã tắt"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Đưa lên"
                        disabled={!canUpdate || index === 0 || busyId !== null}
                        onClick={() => void move(language, -1)}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Đưa xuống"
                        disabled={
                          !canUpdate ||
                          index === items.length - 1 ||
                          busyId !== null
                        }
                        onClick={() => void move(language, 1)}
                      >
                        <ArrowDown />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {canUpdate && !language.isDefault ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busyId !== null}
                          onClick={() =>
                            void mutate(
                              language,
                              () => setDefaultLanguage(language.id),
                              `Đã đặt ${language.nativeName || language.name} làm mặc định.`,
                            )
                          }
                        >
                          <Star />
                          Đặt mặc định
                        </Button>
                      ) : null}
                      {canUpdate ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Chỉnh sửa"
                          onClick={() => {
                            setEditing(language);
                            setEditorOpen(true);
                          }}
                        >
                          <Pencil />
                        </Button>
                      ) : null}
                      {canDelete ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Xóa"
                          disabled={language.isDefault}
                          onClick={() => setDeleting(language)}
                        >
                          <Trash2 />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <LanguageEditor
        open={editorOpen}
        language={editing}
        existingLocales={items.map(({ locale }) => locale)}
        nextSortOrder={
          items.length
            ? Math.max(...items.map(({ sortOrder }) => sortOrder)) + 10
            : 10
        }
        onOpenChange={setEditorOpen}
        onSaved={() => void load()}
      />
      <DeleteLanguageDialog
        language={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        onDeleted={() => void load()}
      />
    </div>
  );
}

function LanguageEditor({
  open,
  language,
  existingLocales,
  nextSortOrder,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  language: Language | null;
  existingLocales: string[];
  nextSortOrder: number;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [form, setForm] = React.useState<LanguagePayload>(emptyLanguage);
  const [saving, setSaving] = React.useState(false);
  const [presetOpen, setPresetOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setForm(
      language
        ? { ...language }
        : { ...emptyLanguage, sortOrder: nextSortOrder },
    );
  }, [language, nextSortOrder, open]);

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
    setPresetOpen(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      if (language) await updateLanguage(language.id, form);
      else await createLanguage(form);
      toast.success(language ? "Đã cập nhật ngôn ngữ." : "Đã tạo ngôn ngữ.");
      onOpenChange(false);
      onSaved();
    } catch (saveError) {
      toast.error(
        saveError instanceof Error
          ? saveError.message
          : "Không thể lưu ngôn ngữ.",
      );
    } finally {
      setSaving(false);
    }
  }

  const textField = (
    key: keyof Pick<LanguagePayload, "name" | "nativeName">,
    label: string,
    placeholder: string,
  ) => (
    <div className="space-y-2">
      <Label htmlFor={`language-${key}`}>{label}</Label>
      <Input
        id={`language-${key}`}
        value={String(form[key] ?? "")}
        placeholder={placeholder}
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            [key]: event.target.value,
          }))
        }
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {language ? "Chỉnh sửa ngôn ngữ" : "Thêm ngôn ngữ"}
          </DialogTitle>
          <DialogDescription>
            Chọn ngôn ngữ để hệ thống tự điền locale, regional code, quốc kỳ và
            hướng hiển thị.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={submit}>
          <div className="space-y-2">
            <Label>Ngôn ngữ</Label>
            <Popover open={presetOpen} onOpenChange={setPresetOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={presetOpen}
                  disabled={Boolean(language)}
                  className="h-11 w-full justify-between font-normal"
                >
                  {form.locale ? (
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{countryFlag(form.flag)}</span>
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
                  <CommandInput placeholder="Tìm theo tên hoặc locale..." />
                  <CommandList>
                    <CommandEmpty>Không tìm thấy ngôn ngữ.</CommandEmpty>
                    <CommandGroup>
                      {languageCatalog.map((preset) => {
                        const unavailable =
                          existingLocales.includes(preset.locale) &&
                          preset.locale !== language?.locale;
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
            {language ? (
              <p className="text-xs text-muted-foreground">
                Locale đã được khóa để không làm mất liên kết translation.
              </p>
            ) : null}
          </div>

          {form.locale ? (
            <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 text-sm sm:grid-cols-4">
              <TechnicalValue label="Locale" value={form.locale} />
              <TechnicalValue label="Code" value={form.code} />
              <TechnicalValue
                label="Regional"
                value={form.regional || "—"}
              />
              <TechnicalValue
                label="Direction"
                value={form.isRtl ? "RTL" : "LTR"}
              />
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            {textField("name", "Tên quản trị", "Japanese")}
            {textField("nativeName", "Tên bản địa", "日本語")}
            <div className="space-y-2">
              <Label htmlFor="language-order">Thứ tự</Label>
              <Input
                id="language-order"
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
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <BooleanField
              label="Đang bật"
              checked={form.isEnabled}
              disabled={form.isDefault}
              onChange={(isEnabled) =>
                setForm((current) => ({ ...current, isEnabled }))
              }
            />
            <BooleanField
              label="Mặc định"
              checked={form.isDefault}
              onChange={(isDefault) =>
                setForm((current) => ({
                  ...current,
                  isDefault,
                  isEnabled: isDefault ? true : current.isEnabled,
                }))
              }
            />
            <div className="flex items-center rounded-lg border p-3 text-sm text-muted-foreground">
              Hướng chữ: {form.isRtl ? "RTL" : "LTR"} (tự động)
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={saving || !form.locale}>
              {saving ? <LoaderCircle className="animate-spin" /> : null}
              {saving ? "Đang lưu..." : "Lưu ngôn ngữ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BooleanField({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-lg border p-3 text-sm">
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onChange(value === true)}
      />
      {label}
    </label>
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
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-xs font-medium">{value}</p>
    </div>
  );
}

function DeleteLanguageDialog({
  language,
  onOpenChange,
  onDeleted,
}: {
  language: Language | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = React.useState(false);

  async function remove() {
    if (!language) return;
    setBusy(true);
    try {
      await deleteLanguage(language.id);
      toast.success("Đã xóa ngôn ngữ.");
      onOpenChange(false);
      onDeleted();
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error
          ? deleteError.message
          : "Không thể xóa ngôn ngữ.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog open={Boolean(language)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa ngôn ngữ?</AlertDialogTitle>
          <AlertDialogDescription>
            Chỉ ngôn ngữ chưa có bản dịch liên quan mới có thể xóa. Với ngôn
            ngữ đã sử dụng, hãy chuyển sang trạng thái tắt.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={busy}
            onClick={(event) => {
              event.preventDefault();
              void remove();
            }}
          >
            {busy ? "Đang xóa..." : "Xóa ngôn ngữ"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function countryFlag(code: string | null) {
  if (!code || !/^[A-Z]{2}$/.test(code)) return "🌐";
  return String.fromCodePoint(
    ...[...code].map((character) => 127397 + character.charCodeAt(0)),
  );
}
