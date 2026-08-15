import Link from "next/link";
import { Ban, CheckCircle2, CircleAlert, Clock3, Copy, LoaderCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
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
  const t = useTranslations("Withdraw");
  return (
    <dl className="space-y-3 text-sm">
      <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{t("amounts.requested")}</dt><dd className="font-medium tabular-nums">{formatCurrency(requested)}</dd></div>
      <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{t("amounts.fee")}</dt><dd className="font-medium tabular-nums">{formatCurrency(fee)}</dd></div>
      <Separator />
      <div className="flex justify-between gap-4"><dt className="font-medium">{t("amounts.net")}</dt><dd className="text-base font-semibold tabular-nums">{formatCurrency(net)}</dd></div>
    </dl>
  );
}

export function WithdrawalConfirmationDialog({ controller }: { controller: WithdrawalController }) {
  const t = useTranslations("Withdraw");
  const { confirmationOpen, submitting, submitError, amount, estimate, selectedMethod, data, setConfirmationOpen, confirmWithdrawal, formatCurrency } = controller;
  if (!estimate || !selectedMethod) return null;
  return (
    <AlertDialog open={confirmationOpen} onOpenChange={(open) => { if (!submitting) setConfirmationOpen(open); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("confirmation.title")}</AlertDialogTitle>
          <AlertDialogDescription>{t("confirmation.description")}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-5">
          <div className="rounded-md border border-border bg-muted/20 p-4"><TransactionAmounts requested={amount} fee={estimate.feeAmount ?? 0} net={estimate.netAmount ?? 0} formatCurrency={formatCurrency} /></div>
          <div><p className="text-xs font-medium text-muted-foreground">{t("confirmation.receiveVia")}</p><p className="mt-1 text-sm font-medium">{selectedMethod.provider} {selectedMethod.maskedAccount}</p><p className="mt-0.5 text-sm text-muted-foreground">{selectedMethod.accountHolder}</p></div>
          {data?.processingEstimate ? <div><p className="text-xs font-medium text-muted-foreground">{t("confirmation.estimatedTime")}</p><p className="mt-1 flex items-center gap-2 text-sm"><Clock3 className="size-4 text-muted-foreground" />{data.processingEstimate}</p></div> : null}
          {submitError ? <Alert variant="destructive"><CircleAlert /><AlertTitle>{t("errors.submitTitle")}</AlertTitle><AlertDescription>{submitError}</AlertDescription></Alert> : null}
        </div>
        <AlertDialogFooter>
          <Button variant="outline" disabled={submitting} onClick={() => setConfirmationOpen(false)}>{t("actions.back")}</Button>
          <Button disabled={submitting} onClick={() => void confirmWithdrawal()}>{submitting ? <><LoaderCircle className="animate-spin" />{t("actions.submitting")}</> : t("actions.confirm")}</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function WithdrawalSuccessDialog({ controller }: { controller: WithdrawalController }) {
  const locale = useLocale();
  const t = useTranslations("Withdraw");
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
          <DialogTitle>{t("success.title")}</DialogTitle>
          <DialogDescription>{t("success.description")}</DialogDescription>
        </DialogHeader>
        <dl className="grid gap-3 rounded-md border border-border bg-muted/20 p-4 text-sm sm:grid-cols-2">
          <div><dt className="text-xs text-muted-foreground">{t("fields.transactionId")}</dt><dd className="mt-1 font-mono text-xs font-medium">{transaction.id}</dd></div>
          <div><dt className="text-xs text-muted-foreground">{t("fields.status")}</dt><dd className="mt-1"><WithdrawalStatusBadge status={transaction.status} /></dd></div>
          <div><dt className="text-xs text-muted-foreground">{t("fields.amount")}</dt><dd className="mt-1 font-medium tabular-nums">{formatCurrency(transaction.requestedAmount)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">{t("fields.net")}</dt><dd className="mt-1 font-medium tabular-nums">{formatCurrency(transaction.netAmount)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">{t("fields.method")}</dt><dd className="mt-1 font-medium">{transaction.method.provider} {transaction.method.maskedAccount}</dd></div>
          <div><dt className="text-xs text-muted-foreground">{t("fields.createdAt")}</dt><dd className="mt-1 font-medium">{formatDateTime(transaction.createdAt, locale)}</dd></div>
        </dl>
        <DialogFooter><Button variant="outline" onClick={() => controller.setSuccessTransaction(undefined)}>{t("actions.close")}</Button><Button onClick={viewHistory}>{t("actions.viewHistory")}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function WithdrawalDetailSheet({ controller }: { controller: WithdrawalController }) {
  const locale = useLocale();
  const t = useTranslations("Withdraw");
  const transaction = controller.detailTransaction;
  const { formatCurrency } = controller;
  const copyId = async () => { if (!transaction) return; await navigator.clipboard.writeText(transaction.id); toast.success(t("messages.copiedId")); };
  if (!transaction) return null;
  return (
    <Sheet open onOpenChange={(open) => { if (!open) controller.setDetailTransaction(undefined); }}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-5 sm:px-6">
          <SheetTitle>{t("details.title")}</SheetTitle>
          <SheetDescription>{transaction.id}</SheetDescription>
        </SheetHeader>
        <div className="space-y-6 px-5 py-5 sm:px-6">
          <section><p className="text-xs font-medium text-muted-foreground">{t("details.currentStatus")}</p><div className="mt-2"><WithdrawalStatusBadge status={transaction.status} /></div>{transaction.status === "processing" ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("details.processingDescription")}</p> : null}</section>
          {transaction.failureReason ? <Alert variant="destructive"><CircleAlert /><AlertTitle>{t("details.processingReason")}</AlertTitle><AlertDescription>{transaction.failureReason}</AlertDescription></Alert> : null}
          <Separator />
          <TransactionAmounts requested={transaction.requestedAmount} fee={transaction.feeAmount} net={transaction.netAmount} formatCurrency={formatCurrency} />
          <Separator />
          <dl className="space-y-4 text-sm">
            <div><dt className="text-xs text-muted-foreground">{t("fields.payoutMethod")}</dt><dd className="mt-1 font-medium">{transaction.method.provider} {transaction.method.maskedAccount}</dd><dd className="mt-0.5 text-muted-foreground">{transaction.method.accountHolder}</dd></div>
            <div><dt className="text-xs text-muted-foreground">{t("fields.transactionId")}</dt><dd className="mt-1 flex items-center gap-2 font-mono text-xs font-medium">{transaction.id}<Button variant="ghost" size="icon-xs" aria-label={t("actions.copyId")} onClick={() => void copyId()}><Copy /></Button></dd></div>
            <div><dt className="text-xs text-muted-foreground">{t("fields.createdDate")}</dt><dd className="mt-1 font-medium">{formatDateTime(transaction.createdAt, locale)}</dd></div>
            {transaction.completedAt ? <div><dt className="text-xs text-muted-foreground">{t("fields.completedDate")}</dt><dd className="mt-1 font-medium">{formatDateTime(transaction.completedAt, locale)}</dd></div> : null}
          </dl>
        </div>
        {transaction.canCancel ? <SheetFooter className="border-t border-border px-5 py-4 sm:px-6"><Button variant="destructive" disabled={controller.cancelling} onClick={() => void controller.cancelWithdrawal(transaction)}>{controller.cancelling ? <LoaderCircle className="animate-spin" /> : <Ban />}{controller.cancelling ? t("actions.cancelling") : t("actions.cancelAndRefund")}</Button></SheetFooter> : null}
        {transaction.status === "rejected" ? <SheetFooter className="border-t border-border px-5 py-4 sm:px-6"><Button variant="outline" asChild><Link href="/member/account">{t("actions.changeMethod")}</Link></Button><Button asChild><Link href="/member/support">{t("actions.contactSupport")}</Link></Button></SheetFooter> : null}
      </SheetContent>
    </Sheet>
  );
}
