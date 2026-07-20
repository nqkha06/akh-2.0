export type OverviewDateRange = "7d" | "30d" | "90d" | "custom";

export type MetricFormat = "number" | "percent" | "currency";

export type OverviewMetric = {
  id: string;
  label: string;
  value: number;
  format: MetricFormat;
  change: number;
  trend: "up" | "down";
  hint: string;
  sparkline: number[];
};

export type PerformancePoint = {
  label: string;
  visits: number;
  unlocks: number;
  conversion: number;
};

export type PerformanceSummary = {
  totalVisits: number;
  dailyAverage: number;
  peakDay: string;
};

export type FunnelStep = {
  id: string;
  label: string;
  value: number;
  rateFromPrevious?: number;
};

export type ContentType =
  | "Social link"
  | "File"
  | "Link-in-bio"
  | "Unlock link";

export type ContentStatus =
  | "active"
  | "draft"
  | "paused"
  | "expired";

export type TopContentItem = {
  id: string;
  name: string;
  href: string;
  type: ContentType;
  status: ContentStatus;
  visits: number;
  unlocks: number;
  conversion: number;
  revenue: number;
};

export type ActivityKind = "unlock" | "published" | "payment" | "milestone";

export type RecentActivityItem = {
  id: string;
  kind: ActivityKind;
  content: string;
  time: string;
  href?: string;
};

export type QuickActionItem = {
  id: string;
  label: string;
  description: string;
  href: string;
  kind: "social" | "file" | "bio" | "unlock";
  shortcut?: string;
};

export type OverviewData = {
  metrics: OverviewMetric[];
  performance: PerformancePoint[];
  performanceSummary: PerformanceSummary;
  funnel: FunnelStep[];
  topContent: TopContentItem[];
  recentActivity: RecentActivityItem[];
  quickActions: QuickActionItem[];
};

