export const websiteMenuStatuses = ["draft", "published"] as const;
export const websiteMenuItemTypes = [
  "PAGE",
  "CUSTOM_URL",
  "ANCHOR",
  "GROUP",
] as const;
export const websiteMenuTargets = ["SELF", "BLANK"] as const;
export const websiteMenuLocations = [
  "header-primary",
  "header-actions",
  "footer-primary",
  "footer-legal",
  "footer-social",
  "mobile-primary",
] as const;

export type WebsiteMenuItemType = (typeof websiteMenuItemTypes)[number];
export type WebsiteMenuLocation = (typeof websiteMenuLocations)[number];

export const WEBSITE_MENU_MAX_DEPTH = 3;
export const WEBSITE_MENU_MAX_ITEMS = 100;
