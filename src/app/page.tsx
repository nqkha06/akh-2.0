import { DashboardShell } from "@/components/dashboard/shell";
import { OverviewView } from "@/components/dashboard/views/overview";

export default function Home() {
  return (
    <DashboardShell>
      <OverviewView />
    </DashboardShell>
  );
}
