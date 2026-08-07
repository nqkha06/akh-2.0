"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { LoaderCircle, RefreshCw, Save, Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
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

const inputClassName =
  "h-11 rounded-lg border-border bg-background shadow-none sm:h-10";

export function MemberPaymentMethodsManager() {
  const [data, setData] =
    React.useState<MemberPaymentMethodsDashboard | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
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
    <>
      {loading ? (
        <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" />
          Đang tải phương thức...
        </div>
      ) : error ? (
        <div className="flex min-h-32 flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" onClick={() => void load()}>
            <RefreshCw />
            Thử lại
          </Button>
        </div>
      ) : data && (data.accounts[0] || data.catalog.length > 0) ? (
        <MemberPaymentMethodEditor
          key={data.accounts[0]?.id ?? "new"}
          catalog={data.catalog}
          defaultLocale={data.defaultLocale}
          account={data.accounts[0] ?? null}
          onDelete={
            data.accounts[0]
              ? () => setDeleting(data.accounts[0] ?? null)
              : undefined
          }
          onSaved={() => void load()}
        />
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Hiện chưa có phương thức thanh toán khả dụng.
        </p>
      )}

      <DeleteMemberPaymentMethodDialog
        account={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        onDeleted={() => void load()}
      />
    </>
  );
}

function MemberPaymentMethodEditor({
  catalog,
  defaultLocale,
  account,
  onDelete,
  onSaved,
}: {
  catalog: PaymentMethod[];
  defaultLocale: string;
  account: UserPaymentMethod | null;
  onDelete?: () => void;
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
  const locale = useLocale();
  const selectedMethod =
    account?.paymentMethod ??
    catalog.find((method) => String(method.id) === methodId) ??
    null;
  const translation = selectedMethod
    ? getPaymentMethodTranslation(selectedMethod, locale, defaultLocale)
    : null;

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
    <form onSubmit={submit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="payment-method-type">Loại phương thức</Label>
          {account ? (
            <Input
              id="payment-method-type"
              value={translation?.name ?? ""}
              className={inputClassName}
              disabled
            />
          ) : (
            <Select
              value={methodId}
              onValueChange={(value) => {
                setMethodId(value);
                setDetails({});
              }}
            >
              <SelectTrigger
                id="payment-method-type"
                className={`${inputClassName} w-full`}
              >
                <SelectValue placeholder="Chọn phương thức" />
              </SelectTrigger>
              <SelectContent>
                {catalog.map((method) => (
                  <SelectItem key={method.id} value={String(method.id)}>
                    {getPaymentMethodTranslation(
                      method,
                      locale,
                      defaultLocale,
                    )?.name || `#${method.id}`}
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
                  className="min-h-24 resize-y rounded-lg border-border bg-background shadow-none"
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
                  className={inputClassName}
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
      </div>
      <div className="-mx-5 -mb-5 mt-6 flex flex-col gap-3 border-t border-border/80 bg-muted/[0.12] px-5 py-4 sm:-mx-6 sm:-mb-6 sm:flex-row sm:items-center sm:justify-end sm:px-6">
        {account && onDelete ? (
          <Button
            type="button"
            variant="outline"
            className="h-10 sm:mr-auto"
            disabled={saving}
            onClick={onDelete}
          >
            <Trash2 />
            Xóa phương thức
          </Button>
        ) : null}
        <Button
          type="submit"
          className="h-10"
          disabled={
            saving ||
            !selectedMethod ||
            Boolean(account && account.paymentMethod.status !== "published")
          }
        >
          {saving ? <LoaderCircle className="animate-spin" /> : <Save />}
          {saving
            ? "Đang lưu..."
            : account
              ? "Lưu thay đổi"
              : "Lưu phương thức"}
        </Button>
      </div>
    </form>
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
