import { DashboardShell } from "@/components/dashboard/shell";
import { RewardsView } from "@/components/dashboard/views/rewards";

export default function MemberRewardsPage() {
  const pageTitle = "Phần thưởng";

  return (
    <DashboardShell pageTitle={pageTitle}>
      <RewardsView title={pageTitle} />
    </DashboardShell>
  );
}
