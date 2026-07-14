import { DashboardShell } from "@/components/dashboard/shell";
import { LevelsView } from "@/components/dashboard/views/levels";

export default function MemberLevelsPage() {
  const pageTitle = "Cấp độ kiếm tiền";

  return (
    <DashboardShell pageTitle={pageTitle}>
      <LevelsView />
    </DashboardShell>
  );
}
