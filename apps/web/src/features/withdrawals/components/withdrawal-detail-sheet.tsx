"use client";

import {
  CircleDollarSign,
  LoaderCircle,
  UserRound,
  XCircle,
} from "lucide-react";
import * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getAdminWithdrawal } from "@/features/withdrawals/api/withdrawals.client";
import type { AdminWithdrawal } from "@/features/withdrawals/types";
import {
  formatWithdrawalDate,
  formatWithdrawalMoney,
  getWithdrawalStatusOption,
} from "@/features/withdrawals/withdrawal-status";
import { cn } from "@/lib/utils";

export function WithdrawalDetailSheet({
  withdrawal,
  onOpenChange,
}: {
  withdrawal: AdminWithdrawal;
  onOpenChange: (open: boolean) => void;
}) {
  const [detail, setDetail] = React.useState<AdminWithdrawal>(withdrawal);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let active = true;

    void getAdminWithdrawal(withdrawal.id)
      .then((record) => {
        if (active) setDetail(record);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Không thể tải chi tiết yêu cầu.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [withdrawal]);

  const status = getWithdrawalStatusOption(detail.status);

  return (
    <Sheet
      open
      onOpenChange={onOpenChange}
    >
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="border-b p-6">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div>
              <SheetTitle>Yêu cầu #{withdrawal.id}</SheetTitle>
              <SheetDescription>
                Thông tin nhận tiền và lịch sử xử lý.
              </SheetDescription>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "whitespace-nowrap font-medium",
                status.badgeClassName,
              )}
            >
              <span
                className={cn("size-1.5 rounded-full", status.dotClassName)}
              />
              {status.label}
            </Badge>
          </div>
        </SheetHeader>

        <div className="space-y-6 px-6 pb-8">
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <LoaderCircle className="size-3.5 animate-spin" />
                Đang đồng bộ chi tiết mới nhất...
              </div>
            ) : null}
            {error ? (
              <Alert variant="destructive">
                <XCircle />
                <AlertTitle>Không thể đồng bộ chi tiết</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <section className="rounded-xl border bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <UserRound className="size-4 text-muted-foreground" />
                Member
              </div>
              <p className="mt-3 font-medium">{detail.user.name}</p>
              <p className="text-sm text-muted-foreground">
                {detail.user.email}
              </p>
            </section>

            <section>
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <CircleDollarSign className="size-4 text-muted-foreground" />
                Giá trị yêu cầu
              </h3>
              <dl className="mt-3 grid grid-cols-2 gap-3">
                <AmountItem
                  label="Số tiền"
                  value={detail.amount}
                  currency={detail.currency}
                />
                <AmountItem
                  label="Phí"
                  value={detail.feeAmount}
                  currency={detail.currency}
                />
                <AmountItem
                  label="Member thực nhận"
                  value={detail.netAmount}
                  currency={detail.currency}
                  className="col-span-2"
                  prominent
                />
              </dl>
            </section>

            <section>
              <h3 className="text-sm font-medium">
                {detail.paymentMethod.name}
              </h3>
              <dl className="mt-3 divide-y rounded-xl border bg-muted/20 px-4">
                {Object.entries(detail.paymentMethod.details).map(
                  ([key, value]) => (
                    <div
                      key={key}
                      className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-4 py-3 text-sm"
                    >
                      <dt className="text-muted-foreground">{key}</dt>
                      <dd className="break-all text-right font-medium">
                        {value}
                      </dd>
                    </div>
                  ),
                )}
              </dl>
            </section>

            {detail.statusReason ? (
              <Alert variant="destructive">
                <XCircle />
                <AlertTitle>Lý do từ chối</AlertTitle>
                <AlertDescription>{detail.statusReason}</AlertDescription>
              </Alert>
            ) : null}

            <section>
              <h3 className="text-sm font-medium">Lịch sử xử lý</h3>
              <dl className="mt-3 divide-y rounded-xl border px-4 text-sm">
                <DetailRow
                  label="Ngày tạo"
                  value={formatWithdrawalDate(detail.createdAt)}
                />
                <DetailRow
                  label="Người xử lý"
                  value={detail.processedBy?.name ?? "—"}
                />
                <DetailRow
                  label="Thời điểm xử lý"
                  value={formatWithdrawalDate(detail.processedAt)}
                />
                <DetailRow
                  label="Cập nhật cuối"
                  value={formatWithdrawalDate(detail.updatedAt)}
                />
              </dl>
            </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AmountItem({
  label,
  value,
  currency,
  prominent,
  className,
}: {
  label: string;
  value: string;
  currency: string;
  prominent?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border bg-card p-4", className)}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "mt-1 font-medium tabular-nums",
          prominent && "text-lg font-semibold",
        )}
      >
        {formatWithdrawalMoney(value, currency)}
      </dd>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
