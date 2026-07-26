"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import {
  CreditCard,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import {
  createMemberPaymentMethod,
  deleteMemberPaymentMethod,
  getMemberPaymentMethods,
  updateMemberPaymentMethod,
} from "../api/payment-methods.client";
import {
  getPaymentMethodTranslation,
  type MemberPaymentMethodsDashboard,
  type PaymentMethod,
  type UserPaymentMethod,
} from "../types";

export function MemberPaymentMethodsManager() {
  const locale = useLocale();
  const [data, setData] =
    React.useState<MemberPaymentMethodsDashboard | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<UserPaymentMethod | null>(null);
  const [deleting, setDeleting] = React.useState<UserPaymentMethod | null>(
    null,
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await getMemberPaymentMethods());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải phương thức thanh toán.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let active = true;
    void getMemberPaymentMethods()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((loadError) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Không thể tải phương thức thanh toán.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-5">
      {data?.catalog.length ? (
        <div className="flex justify-end">
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              setEditing(null);
              setEditorOpen(true);
            }}
          >
            <Plus />
            Thêm phương thức
          </Button>
        </div>
      ) : null}

      <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
        <p className="text-sm leading-6 text-muted-foreground">
          Thông tin tài khoản chỉ được trả về cho chính tài khoản của bạn.
          Không nhập mật khẩu, mã OTP, PIN hoặc mã bảo mật thẻ.
        </p>
      </div>

      {editorOpen ? (
        <MemberPaymentMethodEditor
          key={editing?.id ?? "new"}
          catalog={data?.catalog ?? []}
          defaultLocale={data?.defaultLocale ?? "vi"}
          account={editing}
          onClose={() => {
            setEditorOpen(false);
            setEditing(null);
          }}
          onSaved={() => void load()}
        />
      ) : null}

      {loading ? (
        <div className="flex min-h-56 items-center justify-center gap-2 rounded-xl border bg-card text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" />
          Đang tải phương thức...
        </div>
      ) : error ? (
        <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border bg-card p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" onClick={() => void load()}>
            <RefreshCw />
            Thử lại
          </Button>
        </div>
      ) : data?.accounts.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.accounts.map((account) => {
            const translation = getPaymentMethodTranslation(
              account.paymentMethod,
              locale,
              data.defaultLocale,
            );
            return (
              <Card key={account.id} className="gap-4 py-5 sm:py-6">
                <CardHeader className="px-5 sm:px-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid size-10 shrink-0 place-items-center rounded-lg border bg-muted/30 text-primary">
                        <CreditCard className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="truncate">
                          {translation?.name || "Phương thức thanh toán"}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Rút tối thiểu{" "}
                          {account.paymentMethod.minWithdrawAmount}
                        </CardDescription>
                      </div>
                    </div>
                    {account.paymentMethod.status !== "published" ? (
                      <Badge variant="outline">Chưa xuất bản</Badge>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 px-5 sm:px-6">
                  <dl className="space-y-2">
                    {translation?.fields.map((field) => (
                      <div
                        key={field.key}
                        className="flex items-start justify-between gap-4 text-sm"
                      >
                        <dt className="text-muted-foreground">{field.label}</dt>
                        <dd className="max-w-[60%] break-all text-right font-medium">
                          {maskPaymentDetail(
                            field.key,
                            account.details[field.key],
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <div className="flex justify-end gap-2 border-t pt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={account.paymentMethod.status !== "published"}
                      onClick={() => {
                        setEditing(account);
                        setEditorOpen(true);
                      }}
                    >
                      <Pencil />
                      Chỉnh sửa
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleting(account)}
                    >
                      <Trash2 />
                      Xóa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-card p-6 text-center">
          <CreditCard className="size-9 text-muted-foreground" />
          <h2 className="mt-4 font-semibold">Chưa có tài khoản nhận tiền</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {data?.catalog.length
              ? "Thêm ngân hàng, ví điện tử hoặc phương thức khác được hệ thống hỗ trợ."
              : "Hiện chưa có phương thức nào đang hoạt động. Vui lòng quay lại sau."}
          </p>
          {data?.catalog.length ? (
            <Button className="mt-5" onClick={() => setEditorOpen(true)}>
              <Plus />
              Thêm phương thức đầu tiên
            </Button>
          ) : null}
        </div>
      )}

      <DeleteMemberPaymentMethodDialog
        account={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        onDeleted={() => void load()}
      />
    </div>
  );
}

function MemberPaymentMethodEditor({
  catalog,
  defaultLocale,
  account,
  onClose,
  onSaved,
}: {
  catalog: PaymentMethod[];
  defaultLocale: string;
  account: UserPaymentMethod | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [methodId, setMethodId] = React.useState(
    account
      ? String(account.paymentMethodId)
      : catalog[0]
        ? String(catalog[0].id)
        : "",
  );
  const [details, setDetails] = React.useState<Record<string, string>>(
    account ? { ...account.details } : {},
  );
  const [saving, setSaving] = React.useState(false);
  const editorRef = React.useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const selectedMethod =
    account?.paymentMethod ??
    catalog.find((method) => String(method.id) === methodId) ??
    null;
  const translation = selectedMethod
    ? getPaymentMethodTranslation(selectedMethod, locale, defaultLocale)
    : null;

  React.useEffect(() => {
    window.requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedMethod || !translation) {
      toast.error("Hãy chọn một phương thức thanh toán.");
      return;
    }
    const missing = translation.fields.find(
      (field) => field.required && !details[field.key]?.trim(),
    );
    if (missing) {
      toast.error(`“${missing.label}” là thông tin bắt buộc.`);
      return;
    }
    setSaving(true);
    try {
      if (account) {
        await updateMemberPaymentMethod(account.id, details);
      } else {
        await createMemberPaymentMethod(selectedMethod.id, details);
      }
      toast.success(
        account
          ? "Đã cập nhật phương thức thanh toán."
          : "Đã thêm phương thức thanh toán.",
      );
      onClose();
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
    <Card ref={editorRef} className="gap-0 rounded-2xl py-0">
      <CardHeader className="border-b px-5 py-5 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>
              {account
                ? "Cập nhật tài khoản nhận tiền"
                : "Thêm tài khoản nhận tiền"}
            </CardTitle>
            <CardDescription className="mt-1.5 leading-5">
              Chỉ cung cấp thông tin định danh tài khoản nhận. Không nhập mật
              khẩu hoặc mã xác thực.
            </CardDescription>
          </div>
          <Badge variant="outline">
            {account ? "Chỉnh sửa" : "Tài khoản mới"}
          </Badge>
        </div>
      </CardHeader>
      <form onSubmit={submit}>
        <CardContent className="grid gap-5 px-5 py-5 sm:grid-cols-2 sm:px-6">
          <div className="space-y-2">
            <Label>Loại phương thức</Label>
            {account ? (
              <Input value={translation?.name ?? ""} disabled />
            ) : (
              <Select
                value={methodId}
                onValueChange={(value) => {
                  setMethodId(value);
                  setDetails({});
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn phương thức" />
                </SelectTrigger>
                <SelectContent>
                  {catalog.map((method) => (
                    <SelectItem key={method.id} value={String(method.id)}>
                      {getPaymentMethodTranslation(
                        method,
                        locale,
                        defaultLocale,
                      )?.name ||
                        `#${method.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {translation?.fields.map((field) => {
            const id = `payment-detail-${field.key}`;
            return (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={id}>
                  {field.label}
                  {field.required ? " *" : ""}
                </Label>
                {field.type === "textarea" ? (
                  <Textarea
                    id={id}
                    value={details[field.key] ?? ""}
                    placeholder={field.placeholder}
                    maxLength={500}
                    onChange={(event) =>
                      setDetails((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))
                    }
                  />
                ) : (
                  <Input
                    id={id}
                    type={
                      field.type === "email"
                        ? "email"
                        : field.type === "number"
                          ? "text"
                          : field.type
                    }
                    inputMode={
                      field.type === "number"
                        ? "decimal"
                        : field.type === "tel"
                          ? "tel"
                          : undefined
                    }
                    value={details[field.key] ?? ""}
                    placeholder={field.placeholder}
                    maxLength={500}
                    onChange={(event) =>
                      setDetails((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))
                    }
                  />
                )}
              </div>
            );
          })}
        </CardContent>
        <CardFooter className="justify-end gap-2 border-t px-5 py-4 sm:px-6">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={saving || !selectedMethod}>
            {saving ? <LoaderCircle className="animate-spin" /> : null}
            {saving ? "Đang lưu..." : "Lưu phương thức"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function DeleteMemberPaymentMethodDialog({
  account,
  onOpenChange,
  onDeleted,
}: {
  account: UserPaymentMethod | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const name = account
    ? getPaymentMethodTranslation(account.paymentMethod)?.name
    : "";

  async function remove() {
    if (!account) return;
    setBusy(true);
    try {
      await deleteMemberPaymentMethod(account.id);
      toast.success("Đã xóa phương thức thanh toán.");
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
    <AlertDialog open={Boolean(account)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa tài khoản nhận tiền?</AlertDialogTitle>
          <AlertDialogDescription>
            Thông tin “{name}” sẽ bị xóa khỏi tài khoản của bạn. Thao tác này
            không thể hoàn tác.
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

function maskPaymentDetail(key: string, value?: string) {
  if (!value) return "—";
  if (/(holder|owner|name|bank|branch)/i.test(key)) return value;
  if (value.length <= 4) return "••••";
  return `${"•".repeat(Math.min(8, value.length - 4))}${value.slice(-4)}`;
}
