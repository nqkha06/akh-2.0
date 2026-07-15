"use client";

import { BalanceSummary, WithdrawalEligibilityAlert, WithdrawalErrorState, WithdrawalSkeleton } from "@/components/dashboard/withdraw/withdrawal-summary";
import { WithdrawalForm } from "@/components/dashboard/withdraw/withdrawal-form";
import { PayoutMethodPanel } from "@/components/dashboard/withdraw/payout-method-panel";
import { WithdrawalHistory } from "@/components/dashboard/withdraw/withdrawal-history";
import { WithdrawalConfirmationDialog, WithdrawalDetailSheet, WithdrawalSuccessDialog } from "@/components/dashboard/withdraw/withdrawal-dialogs";
import { useWithdrawalController } from "@/components/dashboard/withdraw/use-withdrawal-controller";
import { PageHeader } from "@/components/dashboard/ui";

export function WithdrawView() {
  const controller = useWithdrawalController();

  if (controller.loading) return <WithdrawalSkeleton />;
  if (controller.pageError || !controller.data) return <WithdrawalErrorState message={controller.pageError} onRetry={() => void controller.retry()} />;

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6">
      <PageHeader title="Rút tiền" description="Chuyển số dư khả dụng về phương thức thanh toán của bạn." />
      <BalanceSummary data={controller.data} />
      <WithdrawalEligibilityAlert data={controller.data} />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.75fr)_minmax(280px,1fr)]">
        <WithdrawalForm controller={controller} />
        <PayoutMethodPanel controller={controller} />
      </div>
      <WithdrawalHistory controller={controller} />
      <WithdrawalConfirmationDialog controller={controller} />
      <WithdrawalSuccessDialog controller={controller} />
      <WithdrawalDetailSheet controller={controller} />
    </div>
  );
}
