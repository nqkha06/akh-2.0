import { DashboardShell } from "@/components/dashboard/shell";
import { FilesView } from "@/components/dashboard/views/files";

export default function BioPage() {
  return (
    <DashboardShell>
      <FilesView />
    </DashboardShell>
  );
}
