import { DashboardShell } from "@/components/dashboard/shell";
import { LinksView } from "@/features/links/components/links-page";

export default function MemberLinksPage() {
  const pageTitle = "Social links";

  return (
    <DashboardShell pageTitle={pageTitle}>
      <LinksView />
    </DashboardShell>
  );
}
