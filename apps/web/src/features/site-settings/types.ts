export const appearanceTabs = ["general", "branding", "social", "contact"] as const;
export type AppearanceTab = (typeof appearanceTabs)[number];

export const socialPlatforms = [
  "facebook",
  "youtube",
  "instagram",
  "tiktok",
  "x",
  "linkedin",
  "github",
  "discord",
  "telegram",
  "zalo",
] as const;
export type SocialPlatform = (typeof socialPlatforms)[number];

export type SiteMedia = {
  id: string;
  alias: string;
  name: string;
  mimeType: string;
  extension: string | null;
  downloadUrl: string;
};

export type WebsiteSocialLink = {
  platform: SocialPlatform;
  url: string;
  isActive: boolean;
  sortOrder: number;
};

export type AdminWebsiteSettings = {
  id: number;
  siteName: string;
  siteShortName: string | null;
  siteDescription: string | null;
  siteTagline: string | null;
  siteUrl: string | null;
  logoLightId: string | null;
  logoDarkId: string | null;
  logoIconId: string | null;
  faviconId: string | null;
  defaultOgImageId: string | null;
  branding: {
    logoLight: SiteMedia | null;
    logoDark: SiteMedia | null;
    logoIcon: SiteMedia | null;
    favicon: SiteMedia | null;
    defaultOgImage: SiteMedia | null;
  };
  socialLinks: WebsiteSocialLink[];
  contactEmail: string | null;
  supportEmail: string | null;
  phone: string | null;
  address: string | null;
  workingHours: string | null;
  mapUrl: string | null;
  updatedAt: string;
};

export type PublicSiteSettings = {
  siteName: string;
  siteShortName: string | null;
  siteDescription: string | null;
  siteTagline: string | null;
  siteUrl: string | null;
  branding: AdminWebsiteSettings["branding"];
  socialLinks: WebsiteSocialLink[];
  contact: {
    email: string | null;
    supportEmail: string | null;
    phone: string | null;
    address: string | null;
    workingHours: string | null;
    mapUrl: string | null;
  };
  updatedAt: string;
};
