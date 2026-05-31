import { DashboardShell } from "@/components/dashboard/shell";
import { LevelsView } from "@/components/dashboard/views/levels";

export default function LevelsPage() {
  return (
    <DashboardShell>
      <LevelsView />
    </DashboardShell>
  );
}
