import { DashboardShell } from "@/components/dashboard/shell";
import { WithdrawView } from "@/components/dashboard/views/withdraw";

export default function MemberWithdrawPage() {
  const pageTitle = "Rút tiền";

  return (
    <DashboardShell pageTitle={pageTitle}>
      <WithdrawView />
    </DashboardShell>
  );
}
