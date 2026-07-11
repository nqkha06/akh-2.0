import { DashboardShell } from "@/components/dashboard/shell";
import { LinksView } from "@/features/links/components/links-page";

export default function LinksPage() {
  return (
    <DashboardShell>
      <LinksView />
    </DashboardShell>
  );
}
