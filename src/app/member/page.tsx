import { DashboardShell } from "@/components/dashboard/shell";
import { OverviewView } from "@/components/dashboard/views/overview";

export default function MemberHomePage() {
  const pageTitle = "Tổng quan";

  return (
    <DashboardShell pageTitle={pageTitle}>
      <OverviewView />
    </DashboardShell>
  );
}
