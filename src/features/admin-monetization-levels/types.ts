export type MonetizationLevelStatus =
  "draft" | "active" | "inactive" | "archived";
export type MonetizationAdDensity = "none" | "limited" | "maximum";
export type MonetizationDeviceType = "any" | "desktop" | "mobile" | "tablet";
export type MonetizationRouteMatchMode = "include" | "exclude";
export type MonetizationBrowserFamily =
  "any" | "chrome" | "safari" | "firefox" | "edge" | "other";

export type MonetizationLevelTranslation = {
  locale: string;
  name: string;
  description: string | null;
};

export type MonetizationRoute = {
  id: string;
  countryCode: string;
  countryMode: MonetizationRouteMatchMode;
  deviceType: MonetizationDeviceType;
  deviceMode: MonetizationRouteMatchMode;
  browserFamily: MonetizationBrowserFamily;
  browserMode: MonetizationRouteMatchMode;
  targetUrl: string;
  priority: number;
  weight: number;
  enabled: boolean;
};

export type MonetizationRate = {
  countryCode: string;
  deviceType: MonetizationDeviceType;
  baseCpm: string;
  currency: string;
  dailyLimit: number | null;
  enabled: boolean;
};

export type MonetizationLevelMetaData = {
  version: 1;
  profitBps: number;
  stepCount: number;
  visitorExperience: {
    popup: MonetizationAdDensity;
    banner: MonetizationAdDensity;
    interstitial: MonetizationAdDensity;
    notification: MonetizationAdDensity;
  };
};

export type AdminMonetizationLevel = {
  id: number;
  key: string;
  displayName: string;
  status: MonetizationLevelStatus;
  isDefault: boolean;
  sortOrder: number;
  translations: MonetizationLevelTranslation[];
  routes: MonetizationRoute[];
  rates: MonetizationRate[];
  metaData: MonetizationLevelMetaData;
  usersCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminMonetizationLevelPayload = Omit<
  AdminMonetizationLevel,
  "id" | "displayName" | "usersCount" | "createdAt" | "updatedAt"
>;

export type NestPaginatedMonetizationLevelsResponse = {
  items: AdminMonetizationLevel[];
  total: number;
  page: number;
  limit: number;
  summary: MonetizationLevelsSummary;
};

export type MonetizationLevelsSummary = {
  activeLevels: number;
  configuredRoutes: number;
  configuredRates: number;
  assignedUsers: number;
};

export type MonetizationLevelsTableData = {
  data: AdminMonetizationLevel[];
  pageCount: number;
  total: number;
  summary: MonetizationLevelsSummary;
};
