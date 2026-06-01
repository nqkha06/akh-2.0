import { DashboardShell } from "@/components/dashboard/shell";
import { FilesView } from "@/components/dashboard/views/files";

export default function FilesPage() {
  return (
    <DashboardShell>
      <FilesView />
    </DashboardShell>
  );
}
