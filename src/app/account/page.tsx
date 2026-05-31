import { DashboardShell } from "@/components/dashboard/shell";
import { AccountView } from "@/components/dashboard/views/account";

export default function AccountPage() {
  return (
    <DashboardShell>
      <AccountView />
    </DashboardShell>
  );
}
