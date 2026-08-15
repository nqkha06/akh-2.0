"use client";

import { useTranslations } from "next-intl";

import { BalanceSummary, WithdrawalEligibilityAlert, WithdrawalErrorState, WithdrawalSkeleton } from "@/components/dashboard/withdraw/withdrawal-summary";
import { WithdrawalForm } from "@/components/dashboard/withdraw/withdrawal-form";
import { WithdrawalHistory } from "@/components/dashboard/withdraw/withdrawal-history";
import { WithdrawalConfirmationDialog, WithdrawalDetailSheet, WithdrawalSuccessDialog } from "@/components/dashboard/withdraw/withdrawal-dialogs";
import { useWithdrawalController } from "@/components/dashboard/withdraw/use-withdrawal-controller";
import { PageContainer, PageHeader } from "@/components/dashboard/ui";

export function WithdrawView() {
  const t = useTranslations("Withdraw");
  const controller = useWithdrawalController();

  if (controller.loading) return <WithdrawalSkeleton />;
  if (controller.pageError || !controller.data) return <WithdrawalErrorState message={controller.pageError} onRetry={() => void controller.retry()} />;

  return (
    <PageContainer>
      <PageHeader title={t("title")} description={t("description")} />
      <BalanceSummary data={controller.data} />
      <WithdrawalEligibilityAlert data={controller.data} />
      <WithdrawalForm controller={controller} />
      <WithdrawalHistory controller={controller} />
      <WithdrawalConfirmationDialog controller={controller} />
      <WithdrawalSuccessDialog controller={controller} />
      <WithdrawalDetailSheet controller={controller} />
    </PageContainer>
  );
}
