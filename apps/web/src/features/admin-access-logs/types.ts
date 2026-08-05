export type AccessLogDetectionStatus = "normal" | "rejected" | "suspicious";
export type AccessLogReviewStatus = "safe" | "suspicious" | "follow_up";
export type AccessRiskLevel = "low" | "medium" | "high" | "critical";

export type AccessLogParty = {
  id: number;
  name: string;
  email: string;
  avatar?: string | null;
};

export type AccessLogLink = {
  id: number;
  title: string;
  slug: string;
};

export type AccessLogReview = {
  status: AccessLogReviewStatus;
  note: string | null;
  reviewedAt: string;
  reviewedBy: { id: number; name: string };
};

export type AdminAccessLog = {
  id: string;
  userId: number;
  linkId: number;
  user: AccessLogParty;
  link: AccessLogLink;
  ipAddress: string | null;
  ipMasked: boolean;
  country: string;
  device: number;
  deviceLabel: string;
  revenue: string;
  isEarn: boolean;
  detectionMask: number;
  detectionReasons: string[];
  rejectReasonMask: number;
  rejectReasons: string[];
  detectionStatus: AccessLogDetectionStatus;
  riskScore: number | null;
  review: AccessLogReview | null;
  completedAt: string | null;
  processedAt: string | null;
  createdAt: string;
};

export type AdminAccessLogDetail = AdminAccessLog & {
  level: { id: number; key: string; name: string } | null;
  agentHash: string;
  userAgent: {
    raw: string;
    browser: string;
    os: string;
    deviceType: number;
  };
  referrer: string | null;
  payoutCpm: string;
  related: {
    sameIp1h: number;
    sameIp24h: number;
    distinctLinkOwnerCount: number;
    sameAgent24h: number;
    links: AccessLogLink[];
    ipRevenue24h: string;
    period: { from: string; to: string };
  };
};

export type AdminAccessLogsResponse = {
  items: AdminAccessLog[];
  page: number;
  perPage: number;
  total: number;
  pageCount: number;
  period: { from: string; to: string };
};

export type AccessLogsStats = {
  period: { from: string; to: string };
  metrics: {
    totalRequests: number;
    earnedRequests: number;
    rejectedRequests: number;
    highRiskLogs: number;
    unreviewedLogs: number;
    suspiciousRevenue: string;
  };
  topIps: Array<{ ipAddress: string | null; requestCount: number }>;
  topUsers: Array<AccessLogParty & { requestCount: number }>;
  topLinks: Array<AccessLogLink & { requestCount: number }>;
  timeline: Array<{ bucket: string; requestCount: number }>;
  note: string;
};

export type FraudReason = {
  code: string;
  category: string;
  score: number;
  message?: string;
  evidence?: Record<string, unknown>;
};

export type AccessAnalysis = {
  period: { from: string; to: string };
  summary: {
    totalRequests: number;
    earnedRequests: number;
    rejectedRequests: number;
    totalRevenue: string;
    uniqueIps: number;
    uniqueAgents: number;
    uniqueCountries: number;
    uniqueLinks: number;
  };
  risk: {
    score: number;
    level: AccessRiskLevel;
    triggeredRuleCount: number;
  };
  reasons: FraudReason[];
  topIps: Array<{
    ipAddress: string | null;
    requestCount: number;
    earnedRequestCount: number;
    revenue: string;
    distinctLinkCount: number;
    distinctUserCount: number;
    firstSeenAt: string;
    lastSeenAt: string;
  }>;
  topAgents: Array<{
    agentHash: string;
    requestCount: number;
    revenue: string;
    distinctIpCount: number;
    distinctLinkCount: number;
    distinctUserCount: number;
    signalStrength: "weak";
  }>;
  topLinks: Array<{
    linkId: number;
    title: string;
    slug: string;
    requestCount: number;
    earnedRequestCount: number;
    revenue: string;
    distinctIpCount: number;
  }>;
  countryDistribution: Array<{
    country: string;
    requestCount: number;
    revenue: string;
  }>;
  trafficTimeline: Array<{
    bucket: string;
    requestCount: number;
    revenue: string;
  }>;
  comparison: { previousPeriodRequests: number };
  ruleStatuses: Array<{ code: string; status: string; message: string }>;
};

export type UserAccessAnalysis = AccessAnalysis & {
  user: AccessLogParty;
};
