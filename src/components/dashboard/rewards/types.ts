export type RewardCurrency = "USD";
export type RewardStatus = "credited" | "verifying" | "invalid" | "expired" | "cancelled";
export type MissionStatus = "not_started" | "in_progress" | "completed" | "claimed" | "expired";
export type MilestoneStatus = "claimed" | "current" | "upcoming";
export type GrowthMetric = "views" | "unlocks" | "clicks";

export type RewardAmount = {
  amount: number;
  currency: RewardCurrency;
};

export type RecentStreakDay = {
  date: string;
  dayLabel: string;
  dateLabel: string;
  status: "completed" | "today" | "missed" | "upcoming";
};

export type RewardMilestone = {
  id: string;
  target: number;
  reward?: RewardAmount;
  status: MilestoneStatus;
  claimedAt?: string;
};

export type GrowthMilestoneGroup = {
  type: GrowthMetric;
  label: string;
  unit: string;
  currentValue: number;
  nextTarget: number;
  milestones: RewardMilestone[];
};

export type RewardMission = {
  id: string;
  icon: "link" | "bio" | "views" | "unlock" | "profile";
  title: string;
  description: string;
  progress: number;
  target: number;
  reward: RewardAmount;
  status: MissionStatus;
  expiresLabel?: string;
  actionHref?: string;
  actionLabel?: string;
};

export type RewardHistoryItem = {
  id: string;
  title: string;
  source: string;
  condition: string;
  amount: RewardAmount;
  status: RewardStatus;
  earnedAt: string;
  creditedAt?: string;
  rejectionReason?: string;
};

export type RewardsDashboardData = {
  summary: {
    availableRewardBalance: RewardAmount;
    pendingRewardBalance: RewardAmount;
    currentStreak: number;
    dailyBonusRate: string;
    nextMilestoneLabel: string;
  };
  streak: {
    currentDays: number;
    longestStreak: number;
    completedToday: boolean;
    resetAtLabel?: string;
    currentBonus: string;
    incrementPerDay?: string;
    maxBonus?: string;
    recentDays: RecentStreakDay[];
    milestones: RewardMilestone[];
  };
  growthMilestones: GrowthMilestoneGroup[];
  missions: RewardMission[];
  history: RewardHistoryItem[];
};

export interface RewardsDataSource {
  getDashboard(): Promise<RewardsDashboardData>;
  claimMission(id: string): Promise<{ mission: RewardMission; historyItem: RewardHistoryItem }>;
}
