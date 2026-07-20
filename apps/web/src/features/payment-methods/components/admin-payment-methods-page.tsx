"use client";

import * as React from "react";
import Link from "next/link";
import {
  CreditCard,
  FileText,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Users,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAdminPermissions } from "@/features/admin-authorization/components/admin-authorization-provider";
import { publicationStatusLabel } from "@/types/publication-status";

import {
  deleteAdminPaymentMethod,
  getAdminPaymentMethods,
} from "../api/payment-methods.client";
import {
  getPaymentMethodTranslation,
  type PaymentMethod,
} from "../types";

export function AdminPaymentMethodsPage() {
  const permissions = useAdminPermissions();
  const canCreate = permissions.includes("payment-methods.create");
  const canUpdate = permissions.includes("payment-methods.update");
  const canDelete = permissions.includes("payment-methods.delete");
  const [items, setItems] = React.useState<PaymentMethod[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [deleting, setDeleting] = React.useState<PaymentMethod | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getAdminPaymentMethods();
      setItems(result.items);
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
    let active = true;
    void getAdminPaymentMethods()
      .then((result) => {
        if (active) setItems(result.items);
      })
      .catch((loadError) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Không thể tải danh mục phương thức.",
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
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 pb-8">
      <AdminPageHeader
        title="Phương thức thanh toán"
        description="Cấu hình tài khoản nhận tiền, mức phí, hạn mức tối thiểu và thông tin member cần cung cấp."
        actions={
          canCreate ? (
            <Button asChild>
              <Link href="/admin/payment-methods/create">
                <Plus />
                Thêm phương thức
              </Link>
            </Button>
          ) : null
        }
      />

      {loading ? (
        <Card className="min-h-64 items-center justify-center rounded-2xl">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            Đang tải danh mục...
          </div>
        </Card>
      ) : error ? (
        <Card className="min-h-64 items-center justify-center rounded-2xl">
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={() => void load()}>
              <RefreshCw />
              Thử lại
            </Button>
          </div>
        </Card>
      ) : items.length === 0 ? (
        <Card className="min-h-64 items-center justify-center rounded-2xl">
          <div className="flex flex-col items-center p-6 text-center">
            <CreditCard className="size-9 text-muted-foreground" />
            <p className="mt-3 font-medium">Chưa có phương thức thanh toán</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Tạo phương thức đầu tiên để member có thể thêm tài khoản nhận tiền.
            </p>
            {canCreate ? (
              <Button className="mt-5" asChild>
                <Link href="/admin/payment-methods/create">
                  <Plus />
                  Thêm phương thức
                </Link>
              </Button>
            ) : null}
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((method) => {
            const translation = getPaymentMethodTranslation(method);
            const userMethodCount = method.userMethodCount ?? 0;
            return (
              <Card
                key={method.id}
                className="gap-5 rounded-2xl py-5 transition-colors hover:border-primary/35"
              >
                <CardHeader className="px-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-muted/40 text-primary">
                        <WalletCards className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">
                          {translation?.name || `Phương thức #${method.id}`}
                        </CardTitle>
                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                          ID {method.id}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        method.status === "published" ? "secondary" : "outline"
                      }
                    >
                      {publicationStatusLabel(method.status)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-5 px-5">
                  <div className="grid grid-cols-2 gap-3">
                    <Metric
                      label="Phí rút"
                      value={method.withdrawFee}
                      icon={<CreditCard />}
                    />
                    <Metric
                      label="Rút tối thiểu"
                      value={method.minWithdrawAmount}
                      icon={<WalletCards />}
                    />
                    <Metric
                      label="Trường dữ liệu"
                      value={String(translation?.fields.length ?? 0)}
                      icon={<FileText />}
                    />
                    <Metric
                      label="Member sử dụng"
                      value={String(userMethodCount)}
                      icon={<Users />}
                    />
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-2 border-t pt-4">
                    <p className="text-xs text-muted-foreground">
                      {method.translations.length} bản dịch
                    </p>
                    <div className="flex gap-1">
                      {canUpdate ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8"
                          asChild
                        >
                          <Link
                            href={`/admin/payment-methods/${method.id}/edit`}
                          >
                            <Pencil />
                            Sửa
                          </Link>
                        </Button>
                      ) : null}
                      {canDelete ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          aria-label="Xóa phương thức"
                          title={
                            userMethodCount > 0
                              ? "Không thể xóa khi đã có member sử dụng"
                              : "Xóa phương thức"
                          }
                          disabled={userMethodCount > 0}
                          onClick={() => setDeleting(method)}
                        >
                          <Trash2 />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-muted/20 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground [&_svg]:size-3.5">
        {icon}
        {label}
      </div>
      <p className="mt-2 truncate font-mono text-sm font-medium">{value}</p>
    </div>
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
