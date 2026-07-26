import type { PublicationStatus } from "@/types/publication-status";

export type LoyaltyTierIconKey =
  | "sparkles"
  | "shield-check"
  | "trophy"
  | "gem";

export type AdminLoyaltyBenefit = {
  key: string;
  label: string;
  included: boolean;
  value: string | null;
};

export type AdminLoyaltyTierTranslation = {
  locale: string;
  name: string;
  description: string | null;
  benefits: AdminLoyaltyBenefit[];
};

export type AdminLoyaltyTier = {
  id: number;
  key: string;
  displayName: string;
  minimumValidViews: number;
  sortOrder: number;
  iconKey: LoyaltyTierIconKey | null;
  status: PublicationStatus;
  translations: AdminLoyaltyTierTranslation[];
  benefitsCount: number;
  includedBenefitsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminLoyaltyTierPayload = Omit<
  AdminLoyaltyTier,
  | "id"
  | "displayName"
  | "benefitsCount"
  | "includedBenefitsCount"
  | "createdAt"
  | "updatedAt"
>;

export type LoyaltyTiersSummary = {
  publishedTiers: number;
  configuredBenefits: number;
  highestThreshold: number;
};

export type NestPaginatedLoyaltyTiersResponse = {
  items: AdminLoyaltyTier[];
  total: number;
  page: number;
  limit: number;
  summary: LoyaltyTiersSummary;
};

export type LoyaltyTiersTableData = {
  data: AdminLoyaltyTier[];
  pageCount: number;
  total: number;
  summary: LoyaltyTiersSummary;
};
