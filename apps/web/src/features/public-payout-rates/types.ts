export type PublicPayoutRate = {
  countryCode: string;
  deviceType: "any" | "desktop" | "mobile" | "tablet";
  baseCpm: string;
  currency: string;
  dailyLimit: number | null;
};

export type PublicPayoutRateLevel = {
  levelId: number;
  key: string;
  profitBps: number;
  rates: PublicPayoutRate[];
};
