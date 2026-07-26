export type LoyaltyBenefit = {
  key: string;
  label: string;
  included: boolean;
  value: string | null;
};

export type LoyaltyTier = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  minimumValidViews: number;
  sortOrder: number;
  iconKey: string | null;
  benefits: LoyaltyBenefit[];
  isCurrent: boolean;
  isNext: boolean;
};

export type LoyaltyTierSummary = {
  key: string;
  name: string;
};

export type LoyaltyHistoryRow = {
  date: string;
  dailyValidViews: number;
  rollingValidViews: number;
  tier: LoyaltyTierSummary | null;
};

export type MemberLoyaltyData = {
  calculation: {
    metric: "earned_views";
    windowDays: number;
    timezone: "UTC";
    lastAggregatedAt: string | null;
  };
  summary: {
    currentValue: number;
    currentTier: LoyaltyTierSummary | null;
    nextTier: LoyaltyTierSummary | null;
    nextTierTarget: number | null;
    remaining: number;
    progress: number;
  };
  tiers: LoyaltyTier[];
  history: LoyaltyHistoryRow[];
};

export type TierStatus = "current" | "next" | "locked";
