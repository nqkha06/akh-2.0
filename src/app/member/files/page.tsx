import { DashboardShell } from "@/components/dashboard/shell";
import { FilesView } from "@/components/dashboard/views/files";

export default function MemberFilesPage() {
  const pageTitle = "Files";

  return (
    <DashboardShell pageTitle={pageTitle}>
      <FilesView />
    </DashboardShell>
  );
}
