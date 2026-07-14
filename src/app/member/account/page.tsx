import { DashboardShell } from "@/components/dashboard/shell";
import { AccountView } from "@/components/dashboard/views/account";

export default function MemberAccountPage() {
  const pageTitle = "Tài khoản";

  return (
    <DashboardShell pageTitle={pageTitle}>
      <AccountView />
    </DashboardShell>
  );
}
