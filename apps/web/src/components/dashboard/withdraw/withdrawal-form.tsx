import Link from "next/link";
import { AlertCircle, Building2, Clock3, LoaderCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import type { WithdrawalController } from "./use-withdrawal-controller";

export function AmountInput({ controller }: { controller: WithdrawalController }) {
  const { data, amountInput, validationError, submitting, setAmount, setMaximumAmount, formatCurrency } = controller;
  if (!data) return null;
  return (
    <div className="grid gap-2">
      <Label htmlFor="withdrawal-amount">Số tiền muốn rút</Label>
      <div className="relative">
        <Input
          id="withdrawal-amount"
          name="amount"
          inputMode="numeric"
          autoComplete="off"
          placeholder="0"
          value={amountInput}
          disabled={submitting}
          aria-invalid={Boolean(validationError)}
          aria-describedby={validationError ? "withdrawal-amount-error" : "withdrawal-amount-help"}
          onChange={(event) => setAmount(event.target.value)}
          className="h-12 pr-12 text-base font-medium tabular-nums"
        />
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-medium text-muted-foreground">{data.currency}</span>
      </div>
      <div id="withdrawal-amount-help" className="flex min-h-8 items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>Số dư khả dụng: <span className="font-medium tabular-nums text-foreground">{formatCurrency(data.availableBalance)}</span></span>
        <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-primary" disabled={submitting} onClick={setMaximumAmount}>Tối đa</Button>
      </div>
      {validationError ? <p id="withdrawal-amount-error" className="flex items-center gap-1.5 text-sm text-destructive"><AlertCircle className="size-4" />{validationError}</p> : null}
    </div>
  );
}

export function WithdrawalBreakdown({ controller }: { controller: WithdrawalController }) {
  const { amount, estimate, estimateLoading, formatCurrency } = controller;
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Số tiền yêu cầu</span><span className="font-medium tabular-nums">{formatCurrency(amount)}</span></div>
      <div className="flex min-h-5 items-center justify-between gap-4">
        <span className="text-muted-foreground">Phí xử lý</span>
        {estimateLoading ? <Skeleton className="h-4 w-20" /> : estimate?.feeAmount != null ? <span className="font-medium tabular-nums">{formatCurrency(estimate.feeAmount)}</span> : <span className="max-w-xs text-right text-xs text-muted-foreground">Phí sẽ được xác nhận trước khi gửi yêu cầu.</span>}
      </div>
      <Separator />
      <div className="flex items-center justify-between gap-4"><span className="font-medium">Bạn sẽ nhận</span><span className="text-base font-semibold tabular-nums text-foreground">{estimate?.netAmount != null ? formatCurrency(estimate.netAmount) : "—"}</span></div>
    </div>
  );
}

export function WithdrawalForm({ controller }: { controller: WithdrawalController }) {
  const { data, selectedMethod, selectedMethodId, submitting, submitError, formEligible, formValid, setSelectedMethodId, requestConfirmation, formatCurrency } = controller;
  if (!data) return null;

  if (!data.payoutMethods.length) {
    return (
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm shadow-black/[0.025] sm:p-6">
        <div className="grid min-h-72 place-items-center text-center">
          <div className="max-w-sm"><div className="mx-auto grid size-11 place-items-center rounded-lg border border-border bg-muted/40 text-primary"><Building2 className="size-5" /></div><h2 className="mt-4 text-lg font-semibold">Bạn chưa thiết lập phương thức nhận tiền</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Thêm một phương thức nhận tiền trong phần cài đặt tài khoản trước khi tạo yêu cầu rút.</p><Button className="mt-5" asChild><Link href="/member/account#payment-method">Thêm phương thức nhận tiền</Link></Button></div>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-black/[0.025]">
      <div className="border-b border-border/80 px-5 py-5 sm:px-6">
        <h2 className="text-base font-semibold tracking-[-0.015em] sm:text-[17px]">Tạo yêu cầu rút tiền</h2>
      </div>
      <form className="space-y-5 p-5 sm:p-6" onSubmit={(event) => { event.preventDefault(); requestConfirmation(); }}>
        <AmountInput controller={controller} />
        <div className="grid gap-2">
          <Label htmlFor="payout-method">Phương thức nhận tiền</Label>
          <Select value={selectedMethodId} onValueChange={setSelectedMethodId} disabled={submitting}>
            <SelectTrigger id="payout-method" className="h-12 w-full"><SelectValue placeholder="Chọn phương thức">{selectedMethod ? `${selectedMethod.provider} ${selectedMethod.maskedAccount} · ${selectedMethod.accountHolder}` : undefined}</SelectValue></SelectTrigger>
            <SelectContent>
              {data.payoutMethods.map((method) => <SelectItem key={method.id} value={method.id}>{method.provider} {method.maskedAccount} · {method.accountHolder}</SelectItem>)}
            </SelectContent>
          </Select>
          {selectedMethod ? <p className="text-xs text-muted-foreground">{selectedMethod.accountHolder} · Phí {formatCurrency(selectedMethod.withdrawFee)}</p> : null}
        </div>
        <div className="rounded-xl border border-border bg-muted/[0.18] p-4"><WithdrawalBreakdown controller={controller} /></div>
        {data.processingEstimate ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="size-4" />Dự kiến nhận tiền trong {data.processingEstimate}</p> : null}
        {submitError ? <Alert variant="destructive"><AlertCircle /><AlertTitle>Không thể tạo yêu cầu</AlertTitle><AlertDescription>{submitError}</AlertDescription></Alert> : null}
        <Button type="submit" className="h-11 w-full sm:w-auto sm:min-w-36" disabled={!formValid || submitting || !formEligible}>
          {submitting ? <><LoaderCircle className="animate-spin" />Đang gửi yêu cầu…</> : "Rút tiền"}
        </Button>
      </form>
    </section>
  );
}
