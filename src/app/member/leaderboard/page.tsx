import { DashboardShell } from "@/components/dashboard/shell";
import { LeaderboardView } from "@/components/dashboard/views/leaderboard";

export default function MemberLeaderboardPage() {
  const pageTitle = "Bảng xếp hạng";

  return (
    <DashboardShell pageTitle={pageTitle}>
      <LeaderboardView />
    </DashboardShell>
  );
}
