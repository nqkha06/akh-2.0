export type FraudRiskLevel = "low" | "medium" | "high" | "critical";

export type FraudRuleResult = {
  code: string;
  category: string;
  triggered: boolean;
  score: number;
  message?: string;
  evidence?: Record<string, unknown>;
};

export type AccessAnalysisContext = {
  totalRequests: number;
  totalRevenue: number;
  previousPeriodRequests: number;
  velocity: Array<{
    ipAddress: string;
    requestCount: number;
    windowSeconds: number;
  }>;
  topIps: Array<{
    ipAddress: string;
    requestCount: number;
    earnedRequestCount: number;
    revenue: number;
    distinctUserCount: number;
  }>;
  sharedAgent: {
    agentHash: string;
    distinctUserCount: number;
    requestCount: number;
  } | null;
  countries: {
    validCountryCount24h: number;
    maxCountriesInHour: number;
    shortestChangeMinutes: number | null;
    values: string[];
  };
};

type FraudRule = {
  code: string;
  category: string;
  evaluate(context: AccessAnalysisContext): FraudRuleResult;
};

const ipHighVelocityRule: FraudRule = {
  code: "IP_HIGH_VELOCITY",
  category: "velocity",
  evaluate(context) {
    const thresholds = [
      { windowSeconds: 60, threshold: 30, score: 25 },
      { windowSeconds: 300, threshold: 100, score: 25 },
      { windowSeconds: 3_600, threshold: 500, score: 20 },
    ];
    const candidates = context.velocity.flatMap((velocity) => {
      const threshold = thresholds.find(
        (item) => item.windowSeconds === velocity.windowSeconds,
      );
      return threshold && velocity.requestCount > threshold.threshold
        ? [{ velocity, threshold }]
        : [];
    });
    const selected = candidates.sort(
      (left, right) =>
        right.threshold.score - left.threshold.score ||
        right.velocity.requestCount - left.velocity.requestCount,
    )[0];
    if (!selected) return notTriggered(this);
    return {
      code: this.code,
      category: this.category,
      triggered: true,
      score: selected.threshold.score,
      message: `IP ${selected.velocity.ipAddress} tạo ${selected.velocity.requestCount} request trong ${formatWindow(selected.velocity.windowSeconds)}.`,
      evidence: {
        ipAddress: selected.velocity.ipAddress,
        requestCount: selected.velocity.requestCount,
        windowSeconds: selected.velocity.windowSeconds,
        threshold: selected.threshold.threshold,
      },
    };
  },
};

const sharedIpActivityRule: FraudRule = {
  code: "SHARED_IP_ACTIVITY",
  category: "shared-identity",
  evaluate(context) {
    const candidate = [...context.topIps]
      .filter((item) => item.distinctUserCount >= 3)
      .sort((left, right) => right.distinctUserCount - left.distinctUserCount)[0];
    if (!candidate) return notTriggered(this);
    const score =
      candidate.distinctUserCount > 10
        ? 30
        : candidate.distinctUserCount >= 6
          ? 20
          : 10;
    return {
      code: this.code,
      category: this.category,
      triggered: true,
      score,
      message: `Một IP tạo traffic cho link của ${candidate.distinctUserCount} chủ sở hữu khác nhau.`,
      evidence: {
        ipAddress: candidate.ipAddress,
        distinctUserCount: candidate.distinctUserCount,
        requestCount: candidate.requestCount,
        meaning: "link_owner_count",
      },
    };
  },
};

const sharedAgentActivityRule: FraudRule = {
  code: "SHARED_AGENT_ACTIVITY",
  category: "shared-agent",
  evaluate(context) {
    const candidate = context.sharedAgent;
    if (!candidate || candidate.distinctUserCount < 3) {
      return notTriggered(this);
    }
    const score =
      candidate.distinctUserCount > 10
        ? 15
        : candidate.distinctUserCount >= 6
          ? 10
          : 5;
    return {
      code: this.code,
      category: this.category,
      triggered: true,
      score,
      message: `Cùng chuỗi User-Agent xuất hiện trên link của ${candidate.distinctUserCount} chủ sở hữu.`,
      evidence: {
        agentHash: candidate.agentHash,
        distinctUserCount: candidate.distinctUserCount,
        requestCount: candidate.requestCount,
        signalStrength: "weak",
        note: "agent_hash chỉ là MD5 của User-Agent, không phải fingerprint thiết bị",
      },
    };
  },
};

const ipRevenueConcentrationRule: FraudRule = {
  code: "IP_REVENUE_CONCENTRATION",
  category: "revenue",
  evaluate(context) {
    if (context.totalRevenue <= 0) return notTriggered(this);
    const candidates = context.topIps.flatMap((item) => {
      const percentage = (item.revenue / context.totalRevenue) * 100;
      const score =
        percentage > 90 && item.earnedRequestCount >= 50
          ? 35
          : percentage > 80 && item.earnedRequestCount >= 30
            ? 25
            : percentage > 60 && item.earnedRequestCount >= 20
              ? 15
              : 0;
      return score ? [{ item, percentage, score }] : [];
    });
    const selected = candidates.sort(
      (left, right) => right.score - left.score || right.percentage - left.percentage,
    )[0];
    if (!selected) return notTriggered(this);
    return {
      code: this.code,
      category: this.category,
      triggered: true,
      score: selected.score,
      message: `IP ${selected.item.ipAddress} tạo ${selected.percentage.toFixed(1)}% revenue trong kỳ.`,
      evidence: {
        ipAddress: selected.item.ipAddress,
        ipRevenue: selected.item.revenue,
        totalRevenue: context.totalRevenue,
        percentage: Number(selected.percentage.toFixed(2)),
        earnedRequestCount: selected.item.earnedRequestCount,
      },
    };
  },
};

const rapidCountryChangeRule: FraudRule = {
  code: "RAPID_COUNTRY_CHANGE",
  category: "location",
  evaluate(context) {
    const signal = context.countries;
    const score =
      signal.shortestChangeMinutes !== null && signal.shortestChangeMinutes < 15
        ? 25
        : signal.maxCountriesInHour >= 3
          ? 25
          : signal.validCountryCount24h >= 3
            ? 15
            : 0;
    if (!score) return notTriggered(this);
    return {
      code: this.code,
      category: this.category,
      triggered: true,
      score,
      message: "Traffic thay đổi quốc gia bất thường trong khoảng thời gian ngắn.",
      evidence: {
        countries: signal.values,
        countryCount: signal.validCountryCount24h,
        maxCountriesInHour: signal.maxCountriesInHour,
        shortestChangeMinutes: signal.shortestChangeMinutes,
      },
    };
  },
};

const trafficSpikeRule: FraudRule = {
  code: "TRAFFIC_SPIKE",
  category: "traffic-spike",
  evaluate(context) {
    const previous = context.previousPeriodRequests;
    if (previous < 10) return notTriggered(this);
    const ratio = context.totalRequests / previous;
    const increase = context.totalRequests - previous;
    const score =
      ratio > 5 && increase >= 100
        ? 35
        : ratio > 3 && increase >= 50
          ? 20
          : 0;
    if (!score) return notTriggered(this);
    return {
      code: this.code,
      category: this.category,
      triggered: true,
      score,
      message: `Traffic tăng ${ratio.toFixed(1)} lần so với kỳ liền trước.`,
      evidence: {
        currentRequests: context.totalRequests,
        previousRequests: previous,
        ratio: Number(ratio.toFixed(2)),
        increase,
      },
    };
  },
};

export const accessFraudRules: FraudRule[] = [
  ipHighVelocityRule,
  sharedIpActivityRule,
  sharedAgentActivityRule,
  ipRevenueConcentrationRule,
  rapidCountryChangeRule,
  trafficSpikeRule,
];

export function evaluateAccessFraudRules(context: AccessAnalysisContext) {
  const evaluated = accessFraudRules.map((rule) => rule.evaluate(context));
  const triggered = evaluated.filter((result) => result.triggered);
  const bestByCategory = new Map<string, FraudRuleResult>();
  for (const result of triggered) {
    const current = bestByCategory.get(result.category);
    if (!current || result.score > current.score) {
      bestByCategory.set(result.category, result);
    }
  }
  const reasons = [...bestByCategory.values()].sort(
    (left, right) => right.score - left.score,
  );
  const score = Math.min(
    100,
    reasons.reduce((total, result) => total + result.score, 0),
  );
  return {
    score,
    level: riskLevel(score),
    triggeredRuleCount: reasons.length,
    reasons,
    evaluated,
  };
}

export function riskLevel(score: number): FraudRiskLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

function notTriggered(rule: Pick<FraudRule, "code" | "category">) {
  return {
    code: rule.code,
    category: rule.category,
    triggered: false,
    score: 0,
  };
}

function formatWindow(seconds: number) {
  if (seconds < 60) return `${seconds} giây`;
  if (seconds < 3_600) return `${seconds / 60} phút`;
  return `${seconds / 3_600} giờ`;
}
