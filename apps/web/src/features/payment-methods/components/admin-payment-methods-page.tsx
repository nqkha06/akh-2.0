"use client";

import * as React from "react";
import {
  CreditCard,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import { getAdminLanguages } from "@/features/languages/api/languages.client";
import type { Language } from "@/features/languages/types";

import {
  createAdminPaymentMethod,
  deleteAdminPaymentMethod,
  getAdminPaymentMethods,
  updateAdminPaymentMethod,
} from "../api/payment-methods.client";
import {
  getPaymentMethodTranslation,
  type PaymentMethod,
  type PaymentMethodFieldType,
  type PaymentMethodPayload,
} from "../types";

type EditableField = {
  id: string;
  key: string;
  type: PaymentMethodFieldType;
  required: boolean;
  labels: Record<string, { label: string; placeholder: string }>;
};

type FormState = {
  withdrawFee: string;
  minWithdrawAmount: string;
  status: "active" | "inactive";
  names: Record<string, string>;
  fields: EditableField[];
};

const emptyForm: FormState = {
  withdrawFee: "0",
  minWithdrawAmount: "0",
  status: "active",
  names: {},
  fields: [],
};

function newField(languages: Language[]): EditableField {
  return {
    id: crypto.randomUUID(),
    key: "",
    type: "text",
    required: true,
    labels: Object.fromEntries(
      languages.map(({ locale }) => [
        locale,
        { label: "", placeholder: "" },
      ]),
    ),
  };
}

function methodToForm(
  method: PaymentMethod,
  languages: Language[],
): FormState {
  const base =
    method.translations.find(
      ({ locale }) =>
        locale === languages.find(({ isDefault }) => isDefault)?.locale,
    ) ?? method.translations[0];
  return {
    withdrawFee: method.withdrawFee,
    minWithdrawAmount: method.minWithdrawAmount,
    status: method.status === "inactive" ? "inactive" : "active",
    names: Object.fromEntries(
      languages.map(({ locale }) => [
        locale,
        method.translations.find(
          (translation) => translation.locale === locale,
        )?.name ?? "",
      ]),
    ),
    fields:
      base?.fields.map((field) => ({
        id: crypto.randomUUID(),
        key: field.key,
        type: field.type,
        required: field.required,
        labels: Object.fromEntries(
          languages.map(({ locale }) => {
            const localized = method.translations
              .find((translation) => translation.locale === locale)
              ?.fields.find(({ key }) => key === field.key);
            return [
              locale,
              {
                label: localized?.label ?? field.label,
                placeholder: localized?.placeholder ?? "",
              },
            ];
          }),
        ),
      })) ?? [],
  };
}

function formToPayload(
  form: FormState,
  languages: Language[],
): PaymentMethodPayload {
  return {
    withdrawFee: form.withdrawFee,
    minWithdrawAmount: form.minWithdrawAmount,
    status: form.status,
    translations: languages
      .filter(
        ({ locale, isDefault }) =>
          isDefault || Boolean(form.names[locale]?.trim()),
      )
      .map(({ locale }) => ({
      locale,
      name: (form.names[locale] ?? "").trim(),
      fields: form.fields.map((field) => {
        const localized = field.labels[locale] ?? {
          label: "",
          placeholder: "",
        };
        return {
          key: field.key.trim(),
          type: field.type,
          required: field.required,
          label: localized.label.trim(),
          ...(localized.placeholder.trim()
            ? { placeholder: localized.placeholder.trim() }
            : {}),
        };
      }),
      })),
  };
}

export function AdminPaymentMethodsPage() {
  const permissions = useAdminPermissions();
  const canCreate = permissions.includes("payment-methods.create");
  const canUpdate = permissions.includes("payment-methods.update");
  const canDelete = permissions.includes("payment-methods.delete");
  const [items, setItems] = React.useState<PaymentMethod[]>([]);
  const [languages, setLanguages] = React.useState<Language[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<PaymentMethod | null>(null);
  const [deleting, setDeleting] = React.useState<PaymentMethod | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [methodsResult, languagesResult] = await Promise.all([
        getAdminPaymentMethods(),
        getAdminLanguages(),
      ]);
      setItems(methodsResult.items);
      setLanguages(languagesResult.items);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải danh mục phương thức.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold">Danh mục hiện có</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Admin chỉ cấu hình loại phương thức và các field cần nhập; không xem
            thông tin tài khoản nhận tiền của member.
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
            Thêm phương thức
          </Button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        {loading ? (
          <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            Đang tải danh mục...
          </div>
        ) : error ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={() => void load()}>
              <RefreshCw />
              Thử lại
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center p-6 text-center">
            <CreditCard className="size-8 text-muted-foreground" />
            <p className="mt-3 font-medium">Chưa có phương thức thanh toán</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tạo phương thức đầu tiên để member có thể thêm tài khoản nhận tiền.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên phương thức</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Phí rút</TableHead>
                <TableHead>Rút tối thiểu</TableHead>
                <TableHead>Fields</TableHead>
                <TableHead>Member dùng</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((method) => {
                const translation = getPaymentMethodTranslation(method);
                return (
                  <TableRow key={method.id}>
                    <TableCell>
                      <div className="font-medium">
                        {translation?.name || `#${method.id}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ID {method.id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          method.status === "active"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {method.status === "active"
                          ? "Hoạt động"
                          : "Tạm ngưng"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {method.withdrawFee}
                    </TableCell>
                    <TableCell className="font-mono">
                      {method.minWithdrawAmount}
                    </TableCell>
                    <TableCell>{translation?.fields.length ?? 0}</TableCell>
                    <TableCell>{method.userMethodCount ?? 0}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {canUpdate ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Chỉnh sửa"
                            onClick={() => {
                              setEditing(method);
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
                            disabled={(method.userMethodCount ?? 0) > 0}
                            onClick={() => setDeleting(method)}
                          >
                            <Trash2 />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <PaymentMethodEditor
        method={editing}
        languages={languages.filter(
          (language) =>
            language.isEnabled ||
            editing?.translations.some(
              ({ locale }) => locale === language.locale,
            ),
        )}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSaved={() => void load()}
      />
      <DeletePaymentMethodDialog
        method={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        onDeleted={() => void load()}
      />
    </div>
  );
}

function PaymentMethodEditor({
  method,
  languages,
  open,
  onOpenChange,
  onSaved,
}: {
  method: PaymentMethod | null;
  languages: Language[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setForm(
      method
        ? methodToForm(method, languages)
        : {
            ...emptyForm,
            names: Object.fromEntries(
              languages.map(({ locale }) => [locale, ""]),
            ),
            fields: [newField(languages)],
          },
    );
  }, [languages, method, open]);

  function updateField(id: string, patch: Partial<EditableField>) {
    setForm((current) => ({
      ...current,
      fields: current.fields.map((field) =>
        field.id === id ? { ...field, ...patch } : field,
      ),
    }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (
      languages.some(
        (language) =>
          language.isDefault && !form.names[language.locale]?.trim(),
      ) ||
      form.fields.length === 0 ||
      form.fields.some(
        (field) =>
          !field.key.trim() ||
          languages
            .filter(
              ({ locale, isDefault }) =>
                isDefault || Boolean(form.names[locale]?.trim()),
            )
            .some(({ locale }) => !field.labels[locale]?.label.trim()),
      )
    ) {
      toast.error("Hãy nhập đủ tên phương thức và cấu hình field.");
      return;
    }
    setSaving(true);
    try {
      const payload = formToPayload(form, languages);
      if (method) {
        await updateAdminPaymentMethod(method.id, payload);
      } else {
        await createAdminPaymentMethod(payload);
      }
      toast.success(method ? "Đã cập nhật phương thức." : "Đã tạo phương thức.");
      onOpenChange(false);
      onSaved();
    } catch (saveError) {
      toast.error(
        saveError instanceof Error
          ? saveError.message
          : "Không thể lưu phương thức.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {method ? "Chỉnh sửa phương thức" : "Thêm phương thức thanh toán"}
          </DialogTitle>
          <DialogDescription>
            Field key là khóa kỹ thuật dùng để lưu chi tiết tài khoản. Không đổi
            key sau khi member đã sử dụng phương thức.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-6" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {languages.map((language) => (
              <div key={language.id} className="space-y-2">
                <Label htmlFor={`payment-${language.locale}-name`}>
                  Tên {language.nativeName || language.name}
                  {language.isDefault ? " *" : ""}
                </Label>
                <Input
                  id={`payment-${language.locale}-name`}
                  value={form.names[language.locale] ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      names: {
                        ...current.names,
                        [language.locale]: event.target.value,
                      },
                    }))
                  }
                  placeholder={language.nativeName || language.name}
                />
              </div>
            ))}
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select
                value={form.status}
                onValueChange={(status: "active" | "inactive") =>
                  setForm((current) => ({ ...current, status }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Tạm ngưng</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-fee">Phí rút</Label>
              <Input
                id="payment-fee"
                inputMode="decimal"
                value={form.withdrawFee}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    withdrawFee: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-minimum">Số tiền rút tối thiểu</Label>
              <Input
                id="payment-minimum"
                inputMode="decimal"
                value={form.minWithdrawAmount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    minWithdrawAmount: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-medium">Thông tin member cần nhập</h3>
                <p className="text-sm text-muted-foreground">
                  Ví dụ: tên chủ tài khoản, số tài khoản, tên ngân hàng.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    fields: [...current.fields, newField(languages)],
                  }))
                }
              >
                <Plus />
                Thêm field
              </Button>
            </div>

            <div className="space-y-3">
              {form.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-3 rounded-lg border bg-muted/20 p-4 lg:grid-cols-12"
                >
                  <div className="space-y-2 lg:col-span-3">
                    <Label>Field key</Label>
                    <Input
                      value={field.key}
                      onChange={(event) =>
                        updateField(field.id, { key: event.target.value })
                      }
                      placeholder="account_number"
                      disabled={Boolean(method?.userMethodCount)}
                    />
                  </div>
                  <div className="space-y-2 lg:col-span-2">
                    <Label>Kiểu dữ liệu</Label>
                    <Select
                      value={field.type}
                      disabled={Boolean(method?.userMethodCount)}
                      onValueChange={(type: PaymentMethodFieldType) =>
                        updateField(field.id, { type })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="tel">Phone</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="textarea">Textarea</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-3 lg:col-span-6 sm:grid-cols-2">
                    {languages.map((language) => (
                      <div key={language.id} className="space-y-2">
                        <Label>
                          Nhãn {language.nativeName || language.name}
                        </Label>
                        <Input
                          value={field.labels[language.locale]?.label ?? ""}
                          onChange={(event) =>
                            updateField(field.id, {
                              labels: {
                                ...field.labels,
                                [language.locale]: {
                                  ...(field.labels[language.locale] ?? {
                                    placeholder: "",
                                  }),
                                  label: event.target.value,
                                },
                              },
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-end justify-end lg:col-span-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`Xóa field ${index + 1}`}
                      disabled={Boolean(method?.userMethodCount)}
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          fields: current.fields.filter(
                            (item) => item.id !== field.id,
                          ),
                        }))
                      }
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  <div className="grid gap-3 lg:col-span-10 sm:grid-cols-2">
                    {languages.map((language) => (
                      <div key={language.id} className="space-y-2">
                        <Label>
                          Gợi ý {language.nativeName || language.name}
                        </Label>
                        <Input
                          value={
                            field.labels[language.locale]?.placeholder ?? ""
                          }
                          onChange={(event) =>
                            updateField(field.id, {
                              labels: {
                                ...field.labels,
                                [language.locale]: {
                                  ...(field.labels[language.locale] ?? {
                                    label: "",
                                  }),
                                  placeholder: event.target.value,
                                },
                              },
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <label className="flex items-center gap-2 self-end pb-2 text-sm lg:col-span-2">
                    <Checkbox
                      checked={field.required}
                      disabled={Boolean(method?.userMethodCount)}
                      onCheckedChange={(checked) =>
                        updateField(field.id, { required: checked === true })
                      }
                    />
                    Bắt buộc
                  </label>
                </div>
              ))}
            </div>
          </section>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <LoaderCircle className="animate-spin" /> : null}
              {saving ? "Đang lưu..." : "Lưu phương thức"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeletePaymentMethodDialog({
  method,
  onOpenChange,
  onDeleted,
}: {
  method: PaymentMethod | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const name = method ? getPaymentMethodTranslation(method)?.name : "";

  async function remove() {
    if (!method) return;
    setBusy(true);
    try {
      await deleteAdminPaymentMethod(method.id);
      toast.success(`Đã xóa “${name}”.`);
      onOpenChange(false);
      onDeleted();
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error
          ? deleteError.message
          : "Không thể xóa phương thức.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog open={Boolean(method)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa phương thức thanh toán?</AlertDialogTitle>
          <AlertDialogDescription>
            “{name}” và cấu hình field sẽ bị xóa vĩnh viễn. Phương thức đã có
            member sử dụng sẽ không thể xóa.
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
            {busy ? "Đang xóa..." : "Xóa phương thức"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
