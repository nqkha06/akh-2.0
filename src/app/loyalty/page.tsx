import { DashboardShell } from "@/components/dashboard/shell";
import { LoyaltyView } from "@/components/dashboard/views/loyalty";

export default function LoyaltyPage() {
  return (
    <DashboardShell>
      <LoyaltyView />
    </DashboardShell>
  );
}
