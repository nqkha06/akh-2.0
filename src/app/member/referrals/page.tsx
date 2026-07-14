import { DashboardShell } from "@/components/dashboard/shell";
import { ReferralsView } from "@/components/dashboard/views/referrals";

export default function MemberReferralsPage() {
  const pageTitle = "Giới thiệu";

  return (
    <DashboardShell pageTitle={pageTitle}>
      <ReferralsView />
    </DashboardShell>
  );
}
