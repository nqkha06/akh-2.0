import { DashboardShell } from "@/components/dashboard/shell";
import { LeaderboardView } from "@/components/dashboard/views/leaderboard";

export default function LeaderboardPage() {
  return (
    <DashboardShell>
      <LeaderboardView />
    </DashboardShell>
  );
}
