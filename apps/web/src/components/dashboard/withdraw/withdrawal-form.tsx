import { AlertCircle, Clock3, LoaderCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemberCurrency } from "@/features/currencies/components/member-currency-provider";

import type { WithdrawalController } from "./use-withdrawal-controller";

const QUICK_WITHDRAWAL_VND_AMOUNTS = [
  100_000,
  200_000,
  500_000,
  1_000_000,
  2_000_000,
] as const;

export function AmountInput({ controller }: { controller: WithdrawalController }) {
  const locale = useLocale();
  const t = useTranslations("Withdraw");
  const { convertCurrency } = useMemberCurrency();
  const {
    data,
    amount,
    amountInput,
    selectedMethod,
    validationError,
    submitting,
    setAmount,
    setMaximumAmount,
    formatCurrency,
  } = controller;
  if (!data) return null;

  const maximumAmount = Math.max(
    0,
    Math.min(
      data.availableBalance,
      data.limits.maximum,
      data.limits.remaining ?? Number.POSITIVE_INFINITY,
    ),
  );
  const minimumAmount = selectedMethod?.minimumAmount ?? data.limits.minimum;
  const quickAmounts = QUICK_WITHDRAWAL_VND_AMOUNTS.map((vndAmount) => ({
    amount: Math.max(
      1,
      Math.round(convertCurrency(vndAmount, "VND", data.currency)),
    ),
    vndAmount,
  }));
  const currencySymbol =
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: data.currency,
      currencyDisplay: "narrowSymbol",
    })
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value ?? data.currency;

  return (
    <div className="grid gap-2">
      <Label htmlFor="withdrawal-amount">{t("form.amountLabel")}</Label>
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
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-medium text-muted-foreground">{currencySymbol}</span>
      </div>
      <div className="flex flex-wrap gap-2" aria-label={t("form.quickAmountAria")}>
        {quickAmounts.map((option) => (
          <Button
            key={option.vndAmount}
            type="button"
            variant={amount === option.amount ? "default" : "outline"}
            size="sm"
            className="min-w-24 tabular-nums"
            disabled={
              submitting ||
              option.amount < minimumAmount ||
              option.amount > maximumAmount
            }
            aria-pressed={amount === option.amount}
            onClick={() => setAmount(String(option.amount))}
          >
            {formatCurrency(option.amount)}
          </Button>
        ))}
        <Button
          type="button"
          variant={maximumAmount > 0 && amount === maximumAmount ? "default" : "outline"}
          size="sm"
          className="min-w-24"
          disabled={submitting || maximumAmount <= 0}
          aria-pressed={maximumAmount > 0 && amount === maximumAmount}
          onClick={setMaximumAmount}
        >
          {t("form.maximum")}
        </Button>
      </div>
      <div id="withdrawal-amount-help" className="flex min-h-6 items-center text-xs text-muted-foreground">
        <span>{t("form.availableBalance")}: <span className="font-medium tabular-nums text-foreground">{formatCurrency(data.availableBalance)}</span></span>
      </div>
      {validationError ? <p id="withdrawal-amount-error" className="flex items-center gap-1.5 text-sm text-destructive"><AlertCircle className="size-4" />{validationError}</p> : null}
    </div>
  );
}

export function WithdrawalBreakdown({ controller }: { controller: WithdrawalController }) {
  const t = useTranslations("Withdraw");
  const { amount, estimate, estimateLoading, formatCurrency } = controller;
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">{t("amounts.requested")}</span><span className="font-medium tabular-nums">{formatCurrency(amount)}</span></div>
      <div className="flex min-h-5 items-center justify-between gap-4">
        <span className="text-muted-foreground">{t("amounts.fee")}</span>
        {estimateLoading ? <Skeleton className="h-4 w-20" /> : estimate?.feeAmount != null ? <span className="font-medium tabular-nums">{formatCurrency(estimate.feeAmount)}</span> : <span className="max-w-xs text-right text-xs text-muted-foreground">{t("amounts.feePending")}</span>}
      </div>
      <Separator />
      <div className="flex items-center justify-between gap-4"><span className="font-medium">{t("amounts.net")}</span><span className="text-base font-semibold tabular-nums text-foreground">{estimate?.netAmount != null ? formatCurrency(estimate.netAmount) : "—"}</span></div>
    </div>
  );
}

export function WithdrawalForm({ controller }: { controller: WithdrawalController }) {
  const t = useTranslations("Withdraw");
  const { data, selectedMethod, submitting, submitError, formEligible, formValid, requestConfirmation, formatCurrency } = controller;
  if (!data) return null;

  if (!data.payoutMethods.length) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-black/[0.025]">
      <div className="border-b border-border/80 px-5 py-5 sm:px-6">
        <h2 className="text-base font-semibold tracking-[-0.015em] sm:text-[17px]">{t("form.title")}</h2>
      </div>
      <form className="space-y-5 p-5 sm:p-6" onSubmit={(event) => { event.preventDefault(); requestConfirmation(); }}>
        <AmountInput controller={controller} />
        {selectedMethod ? (
          <div className="grid gap-2">
            <Label>{t("form.methodLabel")}</Label>
            <div className="rounded-xl border border-border bg-muted/[0.16] px-4 py-3">
              <p className="text-sm font-medium">{selectedMethod.provider} {selectedMethod.maskedAccount}</p>
              <p className="mt-1 text-xs text-muted-foreground">{selectedMethod.accountHolder} · {t("form.methodFee", { fee: formatCurrency(selectedMethod.withdrawFee) })}</p>
            </div>
          </div>
        ) : null}
        <div className="rounded-xl border border-border bg-muted/[0.18] p-4"><WithdrawalBreakdown controller={controller} /></div>
        {data.processingEstimate ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="size-4" />{t("form.processingEstimate", { time: data.processingEstimate })}</p> : null}
        {submitError ? <Alert variant="destructive"><AlertCircle /><AlertTitle>{t("errors.createTitle")}</AlertTitle><AlertDescription>{submitError}</AlertDescription></Alert> : null}
        <Button type="submit" className="h-11 w-full sm:w-auto sm:min-w-36" disabled={!formValid || submitting || !formEligible}>
          {submitting ? <><LoaderCircle className="animate-spin" />{t("actions.submitting")}</> : t("actions.withdraw")}
        </Button>
      </form>
    </section>
  );
}
