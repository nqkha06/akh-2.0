import { DashboardShell } from "@/components/dashboard/shell";
import { BioView } from "./bio-view";

export default function MemberBioPage() {
  const pageTitle = "Link-in-bio";

  return (
    <DashboardShell pageTitle={pageTitle}>
      <BioView />
    </DashboardShell>
  );
}
