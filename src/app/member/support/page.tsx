import { DashboardShell } from "@/components/dashboard/shell";
import { SupportView } from "@/components/dashboard/views/support";

export default function MemberSupportPage() {
  const pageTitle = "Hỗ trợ";

  return (
    <DashboardShell pageTitle={pageTitle}>
      <SupportView />
    </DashboardShell>
  );
}
