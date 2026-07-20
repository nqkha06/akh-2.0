"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CircleDollarSign,
  FileInput,
  Languages,
  LoaderCircle,
  LockKeyhole,
  Plus,
  Save,
  Trash2,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PublicationStatusCard } from "@/components/admin/publication-status-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAdminLanguages } from "@/features/languages/api/languages.client";
import type { Language } from "@/features/languages/types";
import type { PublicationStatus } from "@/types/publication-status";

import {
  createAdminPaymentMethod,
  getAdminPaymentMethod,
  updateAdminPaymentMethod,
} from "../api/payment-methods.client";
import type {
  PaymentMethod,
  PaymentMethodFieldType,
  PaymentMethodPayload,
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
  status: PublicationStatus;
  names: Record<string, string>;
  fields: EditableField[];
};

function createEmptyForm(languages: Language[]): FormState {
  return {
    withdrawFee: "0",
    minWithdrawAmount: "0",
    status: "draft",
    names: Object.fromEntries(
      languages.map(({ locale }) => [locale, ""]),
    ),
    fields: [newField(languages)],
  };
}

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
  const defaultLocale = languages.find(({ isDefault }) => isDefault)?.locale;
  const base =
    method.translations.find(({ locale }) => locale === defaultLocale) ??
    method.translations[0];

  return {
    withdrawFee: method.withdrawFee,
    minWithdrawAmount: method.minWithdrawAmount,
    status: method.status,
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
  const translatedLanguages = languages.filter(
    ({ locale, isDefault }) =>
      isDefault || Boolean(form.names[locale]?.trim()),
  );

  return {
    withdrawFee: form.withdrawFee,
    minWithdrawAmount: form.minWithdrawAmount,
    status: form.status,
    translations: translatedLanguages.map(({ locale }) => ({
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

export function PaymentMethodEditorPage({
  paymentMethodId,
}: {
  paymentMethodId?: number;
}) {
  const router = useRouter();
  const editing = paymentMethodId !== undefined;
  const [method, setMethod] = React.useState<PaymentMethod | null>(null);
  const [languages, setLanguages] = React.useState<Language[]>([]);
  const [form, setForm] = React.useState<FormState | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let active = true;
    void Promise.all([
      getAdminLanguages(),
      paymentMethodId
        ? getAdminPaymentMethod(paymentMethodId)
        : Promise.resolve(null),
    ])
      .then(([languageResult, paymentMethod]) => {
        if (!active) return;
        const relevantLanguages = languageResult.items.filter(
          (language) =>
            language.status === "published" ||
            paymentMethod?.translations.some(
              ({ locale }) => locale === language.locale,
            ),
        );
        setLanguages(relevantLanguages);
        setMethod(paymentMethod);
        setForm(
          paymentMethod
            ? methodToForm(paymentMethod, relevantLanguages)
            : createEmptyForm(relevantLanguages),
        );
      })
      .catch((loadError) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Không thể tải dữ liệu phương thức.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [paymentMethodId]);

  function updateField(id: string, patch: Partial<EditableField>) {
    setForm((current) =>
      current
        ? {
            ...current,
            fields: current.fields.map((field) =>
              field.id === id ? { ...field, ...patch } : field,
            ),
          }
        : current,
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    const translatedLanguages = languages.filter(
      ({ locale, isDefault }) =>
        isDefault || Boolean(form.names[locale]?.trim()),
    );
    if (
      languages.length === 0 ||
      languages.some(
        (language) =>
          language.isDefault && !form.names[language.locale]?.trim(),
      ) ||
      form.fields.length === 0 ||
      form.fields.some(
        (field) =>
          !field.key.trim() ||
          translatedLanguages.some(
            ({ locale }) => !field.labels[locale]?.label.trim(),
          ),
      )
    ) {
      setError("Hãy nhập đủ tên phương thức và cấu hình các trường dữ liệu.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = formToPayload(form, languages);
      if (paymentMethodId) {
        await updateAdminPaymentMethod(paymentMethodId, payload);
      } else {
        await createAdminPaymentMethod(payload);
      }
      toast.success(
        editing ? "Đã cập nhật phương thức." : "Đã tạo phương thức.",
      );
      router.push("/admin/payment-methods");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Không thể lưu phương thức.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) {
    return (
      <div className="mx-auto flex min-h-72 w-full max-w-[1240px] items-center justify-center gap-2 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" />
        Đang tải phương thức...
      </div>
    );
  }

  const schemaLocked = Boolean(method?.userMethodCount);

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 pb-8">
      <AdminPageHeader
        title={
          editing
            ? "Chỉnh sửa phương thức thanh toán"
            : "Thêm phương thức thanh toán"
        }
        description="Cấu hình tên hiển thị, phí rút và thông tin member cần nhập."
        leading={
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => router.push("/admin/payment-methods")}
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
              onClick={() => router.push("/admin/payment-methods")}
            >
              Hủy
            </Button>
            <Button
              form="payment-method-editor-form"
              type="submit"
              disabled={saving}
            >
              {saving ? <LoaderCircle className="animate-spin" /> : <Save />}
              {saving ? "Đang lưu..." : "Lưu phương thức"}
            </Button>
          </>
        }
      />

      {error ? (
        <Alert variant="destructive">
          <WalletCards />
          <AlertTitle>Không thể lưu thay đổi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {schemaLocked ? (
        <Alert>
          <LockKeyhole />
          <AlertTitle>Cấu trúc field đã được khóa</AlertTitle>
          <AlertDescription>
            Phương thức này đang được {method?.userMethodCount} member sử dụng.
            Bạn vẫn có thể sửa tên, nhãn, gợi ý, phí và trạng thái; field key,
            kiểu dữ liệu và yêu cầu bắt buộc sẽ được giữ nguyên.
          </AlertDescription>
        </Alert>
      ) : null}

      <form
        id="payment-method-editor-form"
        onSubmit={submit}
        className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.78fr)]"
      >
        <div className="flex flex-col gap-6">
          <SectionCard
            title="Tên hiển thị"
            description="Nhập tên phương thức theo từng ngôn ngữ đang bật."
            icon={<Languages />}
          >
            {languages.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {languages.map((language) => (
                  <Field
                    key={language.id}
                    label={`Tên ${language.nativeName || language.name}`}
                    required={language.isDefault}
                  >
                    <Input
                      value={form.names[language.locale] ?? ""}
                      onChange={(event) =>
                        setForm((current) =>
                          current
                            ? {
                                ...current,
                                names: {
                                  ...current.names,
                                  [language.locale]: event.target.value,
                                },
                              }
                            : current,
                        )
                      }
                      placeholder={language.nativeName || language.name}
                    />
                    <p className="font-mono text-xs text-muted-foreground">
                      {language.locale}
                      {language.isDefault ? " · mặc định" : ""}
                    </p>
                  </Field>
                ))}
              </div>
            ) : (
              <Alert>
                <Languages />
                <AlertTitle>Chưa có ngôn ngữ hoạt động</AlertTitle>
                <AlertDescription>
                  Hãy bật ít nhất một ngôn ngữ trước khi tạo phương thức.
                </AlertDescription>
              </Alert>
            )}
          </SectionCard>

          <SectionCard
            title="Thông tin member cần nhập"
            description="Ví dụ: tên chủ tài khoản, số tài khoản hoặc tên ngân hàng."
            icon={<FileInput />}
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={schemaLocked}
                onClick={() =>
                  setForm((current) =>
                    current
                      ? {
                          ...current,
                          fields: [...current.fields, newField(languages)],
                        }
                      : current,
                  )
                }
              >
                <Plus />
                Thêm field
              </Button>
            }
          >
            <div className="space-y-4">
              {form.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="space-y-5 rounded-xl border bg-muted/15 p-4 sm:p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 font-mono text-xs font-semibold text-primary">
                        {index + 1}
                      </span>
                      <h3 className="font-medium">
                        Field {field.key || "chưa đặt tên"}
                      </h3>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      aria-label={`Xóa field ${index + 1}`}
                      disabled={schemaLocked}
                      onClick={() =>
                        setForm((current) =>
                          current
                            ? {
                                ...current,
                                fields: current.fields.filter(
                                  (item) => item.id !== field.id,
                                ),
                              }
                            : current,
                        )
                      }
                    >
                      <Trash2 />
                    </Button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Field key" required>
                      <Input
                        value={field.key}
                        onChange={(event) =>
                          updateField(field.id, { key: event.target.value })
                        }
                        placeholder="account_number"
                        disabled={schemaLocked}
                      />
                      <p className="text-xs text-muted-foreground">
                        Dùng chữ thường và dấu gạch dưới.
                      </p>
                    </Field>
                    <Field label="Kiểu dữ liệu" required>
                      <Select
                        value={field.type}
                        disabled={schemaLocked}
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
                    </Field>
                  </div>

                  <div className="space-y-4 border-t pt-5">
                    {languages.map((language) => (
                      <div
                        key={language.id}
                        className="grid gap-4 sm:grid-cols-2"
                      >
                        <Field
                          label={`Nhãn · ${language.nativeName || language.name}`}
                          required={
                            language.isDefault ||
                            Boolean(form.names[language.locale]?.trim())
                          }
                        >
                          <Input
                            value={
                              field.labels[language.locale]?.label ?? ""
                            }
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
                            placeholder="Số tài khoản"
                          />
                        </Field>
                        <Field
                          label={`Gợi ý · ${language.nativeName || language.name}`}
                        >
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
                            placeholder="Nhập số tài khoản"
                          />
                        </Field>
                      </div>
                    ))}
                  </div>

                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-sm">
                    <Checkbox
                      checked={field.required}
                      disabled={schemaLocked}
                      onCheckedChange={(checked) =>
                        updateField(field.id, { required: checked === true })
                      }
                    />
                    <span>
                      Bắt buộc member nhập field này trước khi lưu tài khoản
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <aside className="flex flex-col gap-6">
          <SectionCard
            title="Cấu hình thanh toán"
            description="Thiết lập phí và hạn mức rút tiền."
            icon={<CircleDollarSign />}
          >
            <div className="space-y-4">
              <Field label="Phí rút" required>
                <Input
                  inputMode="decimal"
                  value={form.withdrawFee}
                  onChange={(event) =>
                    setForm((current) =>
                      current
                        ? { ...current, withdrawFee: event.target.value }
                        : current,
                    )
                  }
                  placeholder="0"
                />
              </Field>
              <Field label="Số tiền rút tối thiểu" required>
                <Input
                  inputMode="decimal"
                  value={form.minWithdrawAmount}
                  onChange={(event) =>
                    setForm((current) =>
                      current
                        ? {
                            ...current,
                            minWithdrawAmount: event.target.value,
                          }
                        : current,
                    )
                  }
                  placeholder="0"
                />
              </Field>
            </div>
          </SectionCard>

          <PublicationStatusCard
            id="payment-method-status"
            status={form.status}
            onStatusChange={(status) =>
              setForm((current) =>
                current ? { ...current, status } : current,
              )
            }
          />

          <Card className="gap-3 rounded-2xl border-dashed bg-muted/15 p-5">
            <p className="text-sm font-medium">Lưu ý về dữ liệu member</p>
            <p className="text-sm leading-6 text-muted-foreground">
              Admin chỉ định nghĩa cấu trúc field. Thông tin tài khoản nhận tiền
              do member cung cấp không hiển thị tại trang quản trị này.
            </p>
          </Card>
        </aside>
      </form>
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon,
  action,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-0 rounded-2xl py-0">
      <CardHeader className="flex-row items-start justify-between gap-4 border-b px-5 py-5 sm:px-6">
        <div className="flex gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary [&_svg]:size-4">
            {icon}
          </span>
          <div>
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        {action}
      </CardHeader>
      <CardContent className="px-5 py-5 sm:px-6 sm:py-6">
        {children}
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      {children}
    </div>
  );
}
