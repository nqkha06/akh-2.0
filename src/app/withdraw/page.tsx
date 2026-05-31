import { DashboardShell } from "@/components/dashboard/shell";
import { WithdrawView } from "@/components/dashboard/views/withdraw";

export default function WithdrawPage() {
  return (
    <DashboardShell>
      <WithdrawView />
    </DashboardShell>
  );
}
