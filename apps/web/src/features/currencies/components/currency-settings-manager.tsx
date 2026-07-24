"use client";

import * as React from "react";
import {
  BadgeDollarSign,
  Check,
  CircleDollarSign,
  MoreHorizontal,
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
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createCurrency,
  deleteCurrency,
  getAdminCurrencies,
  setDefaultCurrency,
  updateCurrency,
} from "@/features/currencies/api/currencies.client";
import type {
  AdminCurrenciesResponse,
  Currency,
  CurrencyPayload,
} from "@/features/currencies/types";

type CurrencyFormState = {
  code: string;
  name: string;
  symbol: string;
  exchangeRate: string;
  decimalDigits: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: string;
};

const emptyForm: CurrencyFormState = {
  code: "",
  name: "",
  symbol: "",
  exchangeRate: "",
  decimalDigits: "2",
  isDefault: false,
  isActive: true,
  sortOrder: "20",
};

export function CurrencySettingsManager({
  initialData,
  permissions,
}: {
  initialData: AdminCurrenciesResponse;
  permissions: readonly string[];
}) {
  const canCreate = permissions.includes("currencies.create");
  const canUpdate = permissions.includes("currencies.update");
  const canDelete = permissions.includes("currencies.delete");
  const [data, setData] = React.useState(initialData);
  const [editing, setEditing] = React.useState<Currency | null>(null);
  const [form, setForm] = React.useState<CurrencyFormState>(emptyForm);
  const [formOpen, setFormOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<Currency | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [busyId, setBusyId] = React.useState<number | null>(null);

  const refresh = React.useCallback(async () => {
    setData(await getAdminCurrencies());
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({
      ...emptyForm,
      sortOrder: String((data.items.at(-1)?.sortOrder ?? 10) + 10),
    });
    setFormOpen(true);
  }

  function openEdit(currency: Currency) {
    setEditing(currency);
    setForm({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      exchangeRate: currency.exchangeRate,
      decimalDigits: String(currency.decimalDigits),
      isDefault: currency.isDefault,
      isActive: currency.isActive,
      sortOrder: String(currency.sortOrder),
    });
    setFormOpen(true);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: CurrencyPayload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      symbol: form.symbol.trim(),
      exchangeRate: form.exchangeRate.trim(),
      decimalDigits: Number(form.decimalDigits),
      isDefault: form.isDefault,
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder),
    };
    setBusy(true);
    try {
      if (editing) {
        const { code: _code, ...updatePayload } = payload;
        void _code;
        await updateCurrency(editing.id, updatePayload);
        toast.success(`Đã cập nhật ${editing.code}.`);
      } else {
        await createCurrency(payload);
        toast.success(`Đã thêm ${payload.code}.`);
      }
      await refresh();
      setFormOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể lưu tiền tệ.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function mutate(
    currency: Currency,
    action: () => Promise<unknown>,
    message: string,
  ) {
    setBusyId(currency.id);
    try {
      await action();
      await refresh();
      toast.success(message);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể cập nhật tiền tệ.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteCurrency(deleting.id);
      await refresh();
      toast.success(`Đã xóa ${deleting.code}.`);
      setDeleting(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể xóa tiền tệ.",
      );
    } finally {
      setBusy(false);
    }
  }

  const base = data.items.find((item) => item.isBase);
  const defaultCurrency = data.items.find((item) => item.isDefault);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Tiền tệ cơ sở"
          value={base?.code ?? data.baseCurrency}
          description="Mốc tỷ giá cố định bằng 1"
          icon={CircleDollarSign}
        />
        <SummaryCard
          label="Tiền tệ mặc định"
          value={defaultCurrency?.code ?? data.defaultCurrency}
          description="Áp dụng khi user chưa chọn"
          icon={Star}
        />
        <SummaryCard
          label="Đang hoạt động"
          value={`${data.items.filter((item) => item.isActive).length}/${data.total}`}
          description="Tiền tệ có thể được lựa chọn"
          icon={BadgeDollarSign}
        />
      </div>

      <Card className="gap-0 overflow-hidden rounded-xl py-0 shadow-none">
        <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="font-semibold">Danh mục tiền tệ</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ví dụ VND = 22.000 nghĩa là 1 USD = 22.000 VND.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label="Làm mới"
              disabled={busyId !== null}
              onClick={() =>
                void refresh().catch((error: unknown) =>
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Không thể làm mới dữ liệu.",
                  ),
                )
              }
            >
              <RefreshCw />
            </Button>
            {canCreate ? (
              <Button type="button" onClick={openCreate}>
                <Plus />
                Thêm tiền tệ
              </Button>
            ) : null}
          </div>
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="pl-4 sm:pl-5">Tiền tệ</TableHead>
                <TableHead>Tỷ giá theo 1 USD</TableHead>
                <TableHead>Số lẻ</TableHead>
                <TableHead>Thứ tự</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-12 pr-4 text-right sm:pr-5">
                  <span className="sr-only">Thao tác</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((currency) => (
                <TableRow key={currency.id}>
                  <TableCell className="pl-4 sm:pl-5">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-lg border bg-muted/20 font-medium">
                        {currency.symbol}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold">
                            {currency.code}
                          </span>
                          {currency.isBase ? (
                            <Badge variant="outline">Cơ sở</Badge>
                          ) : null}
                          {currency.isDefault ? (
                            <Badge variant="secondary">Mặc định</Badge>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {currency.name}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">
                    {formatRate(currency.exchangeRate)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {currency.decimalDigits}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {currency.sortOrder}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={currency.isActive ? "secondary" : "outline"}
                    >
                      {currency.isActive ? "Hoạt động" : "Đã tắt"}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-4 text-right sm:pr-5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={busyId !== null}
                          aria-label={`Thao tác với ${currency.code}`}
                        >
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canUpdate ? (
                          <DropdownMenuItem onSelect={() => openEdit(currency)}>
                            <Pencil />
                            Chỉnh sửa
                          </DropdownMenuItem>
                        ) : null}
                        {canUpdate && !currency.isDefault ? (
                          <DropdownMenuItem
                            onSelect={() =>
                              void mutate(
                                currency,
                                () => setDefaultCurrency(currency.id),
                                `Đã đặt ${currency.code} làm mặc định.`,
                              )
                            }
                          >
                            <Star />
                            Đặt làm mặc định
                          </DropdownMenuItem>
                        ) : null}
                        {canUpdate &&
                        !currency.isBase &&
                        !currency.isDefault ? (
                          <DropdownMenuItem
                            onSelect={() =>
                              void mutate(
                                currency,
                                () =>
                                  updateCurrency(currency.id, {
                                    isActive: !currency.isActive,
                                  }),
                                currency.isActive
                                  ? `Đã tắt ${currency.code}.`
                                  : `Đã bật ${currency.code}.`,
                              )
                            }
                          >
                            <Check />
                            {currency.isActive ? "Tắt tiền tệ" : "Bật tiền tệ"}
                          </DropdownMenuItem>
                        ) : null}
                        {canDelete && !currency.isBase ? (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              disabled={currency.isDefault}
                              onSelect={() => setDeleting(currency)}
                            >
                              <Trash2 />
                              Xóa
                            </DropdownMenuItem>
                          </>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CurrencyDialog
        open={formOpen}
        editing={editing}
        form={form}
        busy={busy}
        onOpenChange={setFormOpen}
        onChange={setForm}
        onSubmit={submit}
      />

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa tiền tệ {deleting?.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              Chỉ có thể xóa khi không còn user nào lựa chọn tiền tệ này. Nếu
              vẫn cần giữ lịch sử cấu hình, hãy chuyển sang trạng thái tắt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={busy}
              onClick={() => void remove()}
            >
              {busy ? "Đang xóa..." : "Xóa tiền tệ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="gap-0 rounded-xl py-0 shadow-none">
      <CardContent className="flex items-center gap-3 p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border bg-muted/20 text-muted-foreground">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-0.5 font-semibold tabular-nums">{value}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function CurrencyDialog({
  open,
  editing,
  form,
  busy,
  onOpenChange,
  onChange,
  onSubmit,
}: {
  open: boolean;
  editing: Currency | null;
  form: CurrencyFormState;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: React.Dispatch<React.SetStateAction<CurrencyFormState>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={onSubmit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Chỉnh sửa ${editing.code}` : "Thêm tiền tệ"}
            </DialogTitle>
            <DialogDescription>
              Tỷ giá luôn được tính theo USD. Mã tiền tệ không thể đổi sau khi
              tạo để bảo toàn lựa chọn đã lưu của user.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mã ISO 4217" htmlFor="currency-code">
              <Input
                id="currency-code"
                value={form.code}
                maxLength={3}
                disabled={Boolean(editing)}
                placeholder="VND"
                className="uppercase"
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    code: event.target.value
                      .replace(/[^a-z]/gi, "")
                      .toUpperCase(),
                  }))
                }
                required
              />
            </Field>
            <Field label="Ký hiệu" htmlFor="currency-symbol">
              <Input
                id="currency-symbol"
                value={form.symbol}
                maxLength={12}
                placeholder="₫"
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    symbol: event.target.value,
                  }))
                }
                required
              />
            </Field>
            <Field
              label="Tên tiền tệ"
              htmlFor="currency-name"
              className="sm:col-span-2"
            >
              <Input
                id="currency-name"
                value={form.name}
                maxLength={100}
                placeholder="Vietnamese đồng"
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                required
              />
            </Field>
            <Field label="1 USD bằng" htmlFor="currency-rate">
              <Input
                id="currency-rate"
                type="number"
                inputMode="decimal"
                min="0.00000001"
                step="any"
                value={form.exchangeRate}
                disabled={editing?.isBase}
                placeholder="22000"
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    exchangeRate: event.target.value,
                  }))
                }
                required
              />
            </Field>
            <Field label="Số chữ số thập phân" htmlFor="currency-digits">
              <Input
                id="currency-digits"
                type="number"
                min={0}
                max={4}
                value={form.decimalDigits}
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    decimalDigits: event.target.value,
                  }))
                }
                required
              />
            </Field>
            <Field label="Thứ tự" htmlFor="currency-order">
              <Input
                id="currency-order"
                type="number"
                min={0}
                max={10_000}
                value={form.sortOrder}
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    sortOrder: event.target.value,
                  }))
                }
                required
              />
            </Field>
            <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
              <div>
                <Label htmlFor="currency-active">Đang hoạt động</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cho phép member lựa chọn.
                </p>
              </div>
              <Switch
                id="currency-active"
                checked={form.isActive}
                disabled={editing?.isBase || editing?.isDefault}
                onCheckedChange={(checked) =>
                  onChange((current) => ({
                    ...current,
                    isActive: checked,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 sm:col-span-2">
              <div>
                <Label htmlFor="currency-default">Tiền tệ mặc định</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Dùng khi member chưa thiết lập lựa chọn riêng.
                </p>
              </div>
              <Switch
                id="currency-default"
                checked={form.isDefault}
                disabled={editing?.isDefault}
                onCheckedChange={(checked) =>
                  onChange((current) => ({
                    ...current,
                    isDefault: checked,
                    isActive: checked ? true : current.isActive,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Thêm tiền tệ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function formatRate(value: string) {
  const number = Number(value);
  if (!Number.isFinite(number)) return value;
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 8,
  }).format(number);
}
