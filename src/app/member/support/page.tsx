import { DashboardShell } from "@/components/dashboard/shell";
import { SupportView } from "@/components/dashboard/views/support";

export default function MemberSupportPage() {
  return (
    <DashboardShell pageTitle="Hỗ trợ">
      <SupportView />
    </DashboardShell>
  );
}
