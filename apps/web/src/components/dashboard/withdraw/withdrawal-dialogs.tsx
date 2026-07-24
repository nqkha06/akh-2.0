import Link from "next/link";
import { Ban, CheckCircle2, CircleAlert, Clock3, Copy, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import type { WithdrawalController } from "./use-withdrawal-controller";
import { formatDateTime } from "./use-withdrawal-controller";
import { WithdrawalStatusBadge } from "./withdrawal-history";

function TransactionAmounts({ requested, fee, net, formatCurrency }: { requested: number; fee: number; net: number; formatCurrency: (value: number) => string }) {
  return (
    <dl className="space-y-3 text-sm">
      <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Số tiền yêu cầu</dt><dd className="font-medium tabular-nums">{formatCurrency(requested)}</dd></div>
      <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Phí xử lý</dt><dd className="font-medium tabular-nums">{formatCurrency(fee)}</dd></div>
      <Separator />
      <div className="flex justify-between gap-4"><dt className="font-medium">Bạn sẽ nhận</dt><dd className="text-base font-semibold tabular-nums">{formatCurrency(net)}</dd></div>
    </dl>
  );
}

export function WithdrawalConfirmationDialog({ controller }: { controller: WithdrawalController }) {
  const { confirmationOpen, submitting, submitError, amount, estimate, selectedMethod, data, setConfirmationOpen, confirmWithdrawal, formatCurrency } = controller;
  if (!estimate || !selectedMethod) return null;
  return (
    <AlertDialog open={confirmationOpen} onOpenChange={(open) => { if (!submitting) setConfirmationOpen(open); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận yêu cầu rút tiền</AlertDialogTitle>
          <AlertDialogDescription>Kiểm tra kỹ thông tin trước khi gửi yêu cầu.</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-5">
          <div className="rounded-md border border-border bg-muted/20 p-4"><TransactionAmounts requested={amount} fee={estimate.feeAmount ?? 0} net={estimate.netAmount ?? 0} formatCurrency={formatCurrency} /></div>
          <div><p className="text-xs font-medium text-muted-foreground">Nhận qua</p><p className="mt-1 text-sm font-medium">{selectedMethod.provider} {selectedMethod.maskedAccount}</p><p className="mt-0.5 text-sm text-muted-foreground">{selectedMethod.accountHolder}</p></div>
          {data?.processingEstimate ? <div><p className="text-xs font-medium text-muted-foreground">Thời gian dự kiến</p><p className="mt-1 flex items-center gap-2 text-sm"><Clock3 className="size-4 text-muted-foreground" />{data.processingEstimate}</p></div> : null}
          {submitError ? <Alert variant="destructive"><CircleAlert /><AlertTitle>Không thể gửi yêu cầu</AlertTitle><AlertDescription>{submitError}</AlertDescription></Alert> : null}
        </div>
        <AlertDialogFooter>
          <Button variant="outline" disabled={submitting} onClick={() => setConfirmationOpen(false)}>Quay lại</Button>
          <Button disabled={submitting} onClick={() => void confirmWithdrawal()}>{submitting ? <><LoaderCircle className="animate-spin" />Đang gửi yêu cầu…</> : "Xác nhận rút tiền"}</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function WithdrawalSuccessDialog({ controller }: { controller: WithdrawalController }) {
  const transaction = controller.successTransaction;
  const { formatCurrency } = controller;
  if (!transaction) return null;
  const viewHistory = () => {
    controller.setSuccessTransaction(undefined);
    requestAnimationFrame(() => document.getElementById("withdrawal-history-title")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  return (
    <Dialog open onOpenChange={(open) => { if (!open) controller.setSuccessTransaction(undefined); }}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-1 grid size-10 place-items-center rounded-md bg-primary/10 text-primary"><CheckCircle2 className="size-5" /></div>
          <DialogTitle>Yêu cầu rút tiền đã được tạo</DialogTitle>
          <DialogDescription>Số dư và lịch sử giao dịch đã được cập nhật.</DialogDescription>
        </DialogHeader>
        <dl className="grid gap-3 rounded-md border border-border bg-muted/20 p-4 text-sm sm:grid-cols-2">
          <div><dt className="text-xs text-muted-foreground">Mã giao dịch</dt><dd className="mt-1 font-mono text-xs font-medium">{transaction.id}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Trạng thái</dt><dd className="mt-1"><WithdrawalStatusBadge status={transaction.status} /></dd></div>
          <div><dt className="text-xs text-muted-foreground">Số tiền</dt><dd className="mt-1 font-medium tabular-nums">{formatCurrency(transaction.requestedAmount)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Thực nhận</dt><dd className="mt-1 font-medium tabular-nums">{formatCurrency(transaction.netAmount)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Phương thức</dt><dd className="mt-1 font-medium">{transaction.method.provider} {transaction.method.maskedAccount}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Thời gian tạo</dt><dd className="mt-1 font-medium">{formatDateTime(transaction.createdAt)}</dd></div>
        </dl>
        <DialogFooter><Button variant="outline" onClick={() => controller.setSuccessTransaction(undefined)}>Đóng</Button><Button onClick={viewHistory}>Xem lịch sử giao dịch</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function WithdrawalDetailSheet({ controller }: { controller: WithdrawalController }) {
  const transaction = controller.detailTransaction;
  const { formatCurrency } = controller;
  const copyId = async () => { if (!transaction) return; await navigator.clipboard.writeText(transaction.id); toast.success("Đã sao chép mã giao dịch."); };
  if (!transaction) return null;
  return (
    <Sheet open onOpenChange={(open) => { if (!open) controller.setDetailTransaction(undefined); }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-5">
          <SheetTitle>Chi tiết giao dịch</SheetTitle>
          <SheetDescription>{transaction.id}</SheetDescription>
        </SheetHeader>
        <div className="space-y-6 px-5 py-2">
          <section><p className="text-xs font-medium text-muted-foreground">Trạng thái hiện tại</p><div className="mt-2"><WithdrawalStatusBadge status={transaction.status} /></div>{transaction.status === "processing" ? <p className="mt-3 text-sm leading-6 text-muted-foreground">Yêu cầu đang được kiểm tra và chuyển đến đơn vị thanh toán.</p> : null}</section>
          {transaction.failureReason ? <Alert variant="destructive"><CircleAlert /><AlertTitle>Lý do xử lý</AlertTitle><AlertDescription>{transaction.failureReason}</AlertDescription></Alert> : null}
          <Separator />
          <TransactionAmounts requested={transaction.requestedAmount} fee={transaction.feeAmount} net={transaction.netAmount} formatCurrency={formatCurrency} />
          <Separator />
          <dl className="space-y-4 text-sm">
            <div><dt className="text-xs text-muted-foreground">Phương thức nhận tiền</dt><dd className="mt-1 font-medium">{transaction.method.provider} {transaction.method.maskedAccount}</dd><dd className="mt-0.5 text-muted-foreground">{transaction.method.accountHolder}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Mã giao dịch</dt><dd className="mt-1 flex items-center gap-2 font-mono text-xs font-medium">{transaction.id}<Button variant="ghost" size="icon-xs" aria-label="Sao chép mã giao dịch" onClick={() => void copyId()}><Copy /></Button></dd></div>
            <div><dt className="text-xs text-muted-foreground">Ngày tạo</dt><dd className="mt-1 font-medium">{formatDateTime(transaction.createdAt)}</dd></div>
            {transaction.completedAt ? <div><dt className="text-xs text-muted-foreground">Ngày hoàn tất</dt><dd className="mt-1 font-medium">{formatDateTime(transaction.completedAt)}</dd></div> : null}
          </dl>
        </div>
        {transaction.canCancel ? <SheetFooter className="border-t border-border px-5"><Button variant="destructive" disabled={controller.cancelling} onClick={() => void controller.cancelWithdrawal(transaction)}>{controller.cancelling ? <LoaderCircle className="animate-spin" /> : <Ban />}{controller.cancelling ? "Đang hủy…" : "Hủy yêu cầu và hoàn số dư"}</Button></SheetFooter> : null}
        {transaction.status === "rejected" ? <SheetFooter className="border-t border-border px-5"><Button variant="outline" asChild><Link href="/member/account">Đổi phương thức nhận tiền</Link></Button><Button asChild><Link href="/member/support">Liên hệ hỗ trợ</Link></Button></SheetFooter> : null}
      </SheetContent>
    </Sheet>
  );
}
