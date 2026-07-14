import { DashboardShell } from "@/components/dashboard/shell";
import SocialLinksGenerator from "./demo";

export default function MemberCreatePage() {
  const pageTitle = "Tạo Social Link";

  return (
    <DashboardShell pageTitle={pageTitle}>
      <SocialLinksGenerator />
    </DashboardShell>
  );
}
