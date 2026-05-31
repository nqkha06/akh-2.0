import { DashboardShell } from "@/components/dashboard/shell";
import { NewView } from "@/components/dashboard/views/new";

export default function NewPage() {
  return (
    <DashboardShell>
      <NewView />
    </DashboardShell>
  );
}
