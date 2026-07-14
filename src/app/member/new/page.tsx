import { DashboardShell } from "@/components/dashboard/shell";
import { NewView } from "@/components/dashboard/views/new";

export default function MemberNewPage() {
  const pageTitle = "Cập nhật";

  return (
    <DashboardShell pageTitle={pageTitle}>
      <NewView />
    </DashboardShell>
  );
}
