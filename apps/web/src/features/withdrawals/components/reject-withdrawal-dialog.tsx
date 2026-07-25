"use client";

import { LoaderCircle, RotateCcw, TriangleAlert } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { rejectAdminWithdrawal } from "@/features/withdrawals/api/withdrawals.client";
import type { AdminWithdrawal } from "@/features/withdrawals/types";
import { formatWithdrawalMoney } from "@/features/withdrawals/withdrawal-status";

export function RejectWithdrawalDialog({
  withdrawal,
  onOpenChange,
  onSuccess,
}: {
  withdrawal: AdminWithdrawal;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = React.useState(
    withdrawal.statusReason ?? "",
  );
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async () => {
    if (reason.trim().length < 3) return;

    try {
      setSubmitting(true);
      await rejectAdminWithdrawal(withdrawal.id, reason.trim());
      setSubmitting(false);
      toast.success("Đã từ chối yêu cầu và hoàn số dư cho member.");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      setSubmitting(false);
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể từ chối yêu cầu.",
      );
    }
  };

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!submitting) onOpenChange(open);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <TriangleAlert />
          </AlertDialogMedia>
          <AlertDialogTitle>Từ chối yêu cầu rút tiền?</AlertDialogTitle>
          <AlertDialogDescription>
            Yêu cầu #{withdrawal.id} trị giá{" "}
            <strong>
              {formatWithdrawalMoney(
                withdrawal.amount,
                withdrawal.currency,
              )}
            </strong>{" "}
            sẽ bị từ chối và toàn bộ số tiền yêu cầu được hoàn lại vào số dư
            member.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <label
            htmlFor="withdrawal-rejection-reason"
            className="text-sm font-medium"
          >
            Lý do từ chối
          </label>
          <Textarea
            id="withdrawal-rejection-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Nhập lý do để member biết cần điều chỉnh gì..."
            maxLength={500}
            disabled={submitting}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            Tối thiểu 3 ký tự · {reason.length}/500
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={submitting || reason.trim().length < 3}
            onClick={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            {submitting ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <RotateCcw />
            )}
            Từ chối và hoàn tiền
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
