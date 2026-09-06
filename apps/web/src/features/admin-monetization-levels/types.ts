import type { PublicationStatus } from "@/types/publication-status";

export type MonetizationLevelStatus = PublicationStatus;
export type MonetizationAdDensity = "none" | "limited" | "maximum";
export type MonetizationDeviceType = "any" | "desktop" | "mobile" | "tablet";
export type MonetizationRouteMatchMode = "include" | "exclude";
export type MonetizationBrowserFamily =
  "any" | "chrome" | "safari" | "firefox" | "edge" | "other";
export type MonetizationAdFormat = "smartlink" | "banner" | "script";
export type MonetizationAdPlacement =
  | "unlock_redirect"
  | "popunder"
  | "stu_before"
  | "stu_after"
  | "safe_overlay_top"
  | "safe_overlay_bottom";
export type MonetizationOperatingSystem =
  | "any"
  | "android"
  | "ios"
  | "windows"
  | "macos"
  | "linux"
  | "other";
export type MonetizationDeliveryMode = "any" | "original" | "random_post";

export type MonetizationSmartlinkOverrides = {
  redirectDelaySeconds?: number;
  maxRedirectsPerSession?: number;
  maxRedirectsPerVisitor?: number;
  frequencyWindowHours?: number;
  cooldownMinutes?: number;
  startAt?: string;
  endAt?: string;
};

export type MonetizationSmartlink = {
  id: string;
  url: string;
  enabled: boolean;
  weight: number;
  sortOrder: number;
  overrides?: MonetizationSmartlinkOverrides;
};

export type MonetizationAd = {
  id: string;
  name: string;
  enabled: boolean;
  format: MonetizationAdFormat;
  placements: MonetizationAdPlacement[];
  priority: number;
  weight: number;
  targeting: {
    countries: string[];
    devices: MonetizationDeviceType[];
    operatingSystems: MonetizationOperatingSystem[];
    browsers: MonetizationBrowserFamily[];
    deliveryModes: MonetizationDeliveryMode[];
    niches: string[];
    siteKeys: string[];
    postTypes: string[];
    categoryIds: number[];
    locales: string[];
  };
  content: {
    smartlinks?: MonetizationSmartlink[];
    /** Legacy single-Smartlink payload; normalized by the editor and API resolver. */
    targetUrl?: string;
    redirectDelaySeconds?: number;
    maxRedirectsPerSession?: number;
    maxRedirectsPerVisitor?: number;
    frequencyWindowHours?: number;
    cooldownMinutes?: number;
    startAt?: string;
    endAt?: string;
    imageUrl?: string;
    clickUrl?: string;
    title?: string;
    description?: string;
    ctaLabel?: string;
    newTab?: boolean;
    adapter?: string;
    scriptUrl?: string;
    zoneId?: string;
    parameters?: Record<string, string | number | boolean>;
  };
};

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
  ads: MonetizationAd[];
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
  publishedLevels: number;
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
