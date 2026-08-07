import type {
  BackgroundImagePreset,
  BackgroundVideoPreset,
} from "@stu/contracts";

export type PublicBusinessConfig = {
  version: number;
  authentication: {
    registrationEnabled: boolean;
    googleLoginEnabled: boolean;
  };
  operations: {
    maintenanceMode: boolean;
    withdrawalsPaused: boolean;
  };
  uploads: {
    memberFileMaxBytes: number;
    coverImageMaxBytes: number;
    allowedMimeTypes: string[];
  };
  presetLibrary: {
    images: BackgroundImagePreset[];
    videos: BackgroundVideoPreset[];
  };
};

export type AdminBusinessSettings = {
  version: number;
  registrationEnabled: boolean;
  emailVerificationRequired: boolean;
  googleLoginEnabled: boolean;
  baseCurrencyCode: string;
  withdrawalCurrencyCode: string;
  referralCommissionRate: string;
  loyaltyWindowDays: number;
  loyaltyHistoryDays: number;
  memberFileMaxBytes: number;
  coverImageMaxBytes: number;
  adminMediaMaxBytes: number;
  supportAttachmentMaxBytes: number;
  memberStorageQuotaBytes: number;
  uploadAllowedMimeTypes: string[];
  backgroundImages: BackgroundImagePreset[];
  backgroundVideos: BackgroundVideoPreset[];
  maintenanceMode: boolean;
  withdrawalsPaused: boolean;
  updatedAt: string;
  currencies: Array<{
    code: string;
    name: string;
    symbol: string;
    exchangeRate: string;
    isBase: boolean;
    isDefault: boolean;
    isActive: boolean;
  }>;
  uiLanguages: {
    bundled: string[];
    source: "published-languages";
    fallbackLocale: string;
  };
};
