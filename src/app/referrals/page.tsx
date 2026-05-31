import { DashboardShell } from "@/components/dashboard/shell";
import { ReferralsView } from "@/components/dashboard/views/referrals";

export default function ReferralsPage() {
  return (
    <DashboardShell>
      <ReferralsView />
    </DashboardShell>
  );
}
