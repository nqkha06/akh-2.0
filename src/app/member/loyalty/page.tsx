import { DashboardShell } from "@/components/dashboard/shell";
import { LoyaltyView } from "@/components/dashboard/views/loyalty";

export default function MemberLoyaltyPage() {
  const pageTitle = "Thân thiết";

  return (
    <DashboardShell pageTitle={pageTitle}>
      <LoyaltyView />
    </DashboardShell>
  );
}
