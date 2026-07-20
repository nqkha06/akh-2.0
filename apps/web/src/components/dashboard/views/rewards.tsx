
"use client";

import { DailyStreakSection } from "@/components/dashboard/rewards/daily-streak-section";
import { GrowthMilestones } from "@/components/dashboard/rewards/growth-milestones";
import { RewardDetailSheet, RewardHistory } from "@/components/dashboard/rewards/reward-history";
import { RewardsRulesDialog } from "@/components/dashboard/rewards/rewards-rules-dialog";
import { RewardsEmptyState, RewardsErrorState, RewardsInfoAlert, RewardsSkeleton, RewardsSummary } from "@/components/dashboard/rewards/rewards-summary";
import { useRewardsController } from "@/components/dashboard/rewards/use-rewards-controller";
import { WeeklyMissions } from "@/components/dashboard/rewards/weekly-missions";
import { PageHeader } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

export function RewardsView({ title }: { title: string }) {
  const controller = useRewardsController();

  if (controller.loading) return <RewardsSkeleton />;
  if (controller.error || !controller.data) return <RewardsErrorState message={controller.error} onRetry={() => void controller.retry()} />;

  const hasActivity = controller.data.streak.currentDays > 0 || controller.data.growthMilestones.some((group) => group.currentValue > 0) || controller.data.missions.some((mission) => mission.progress > 0);

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6">
      <PageHeader title={title} description="Duy trì hoạt động, đạt các cột mốc và nhận thêm phần thưởng." action={<Button variant="ghost" size="sm" className="w-fit" onClick={() => controller.setRulesOpen(true)}><Info />Thể lệ phần thưởng</Button>} />
      <RewardsInfoAlert />
      <RewardsSummary data={controller.data} />
      {!hasActivity ? <RewardsEmptyState /> : <>
        <DailyStreakSection data={controller.data} />
        <GrowthMilestones data={controller.data} />
        <WeeklyMissions data={controller.data} controller={controller} />
      </>}
      <RewardHistory items={controller.data.history} onOpen={controller.setDetailItem} />
      <RewardsRulesDialog open={controller.rulesOpen} onOpenChange={controller.setRulesOpen} />
      <RewardDetailSheet controller={controller} />
    </div>
  );
}
