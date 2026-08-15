export const websiteMenuLocations = [
  "header-primary",
  "header-actions",
  "footer-primary",
  "footer-legal",
  "footer-social",
  "mobile-primary",
] as const;

export type WebsiteMenuLocation = (typeof websiteMenuLocations)[number];
export type WebsiteMenuItemType =
  | "PAGE"
  | "CUSTOM_URL"
  | "ANCHOR"
  | "GROUP";

export type MenuTranslation = {
  locale: string;
  title: string | null;
};

export type MenuItemTranslation = {
  locale: string;
  label: string;
  title: string | null;
  ariaLabel: string | null;
  urlOverride: string | null;
};

export type WebsiteMenuItem = {
  id: number;
  clientId?: string;
  type: WebsiteMenuItemType;
  pageId: number | null;
  url: string | null;
  target: "SELF" | "BLANK";
  rel: string | null;
  iconKey: string | null;
  isEnabled: boolean;
  translations: MenuItemTranslation[];
  page: {
    id: number;
    title: string;
    slug: string;
    status: string;
    deletedAt: string | null;
  } | null;
  children: WebsiteMenuItem[];
};

export type WebsiteMenu = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  status: "draft" | "published";
  draftVersion: number;
  publishedVersion: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  translations: MenuTranslation[];
  items: WebsiteMenuItem[];
  locations: Array<{ location: WebsiteMenuLocation }>;
  itemCount?: number;
  isDirty: boolean;
};

export type WebsiteMenusResponse = {
  items: WebsiteMenu[];
  total: number;
  allowedLocations: readonly WebsiteMenuLocation[];
};

export type LanguageOption = {
  id: number;
  locale: string;
  nativeName: string | null;
  name: string;
  isDefault: boolean;
  status: string;
};

export type PageOption = {
  id: number;
  title: string;
  slug: string;
  status: string;
};

export type PublicMenuItem = {
  id: number;
  type: WebsiteMenuItemType;
  label: string;
  title: string | null;
  ariaLabel: string | null;
  href: string | null;
  target: "_self" | "_blank";
  rel: string | null;
  iconKey: string | null;
  children: PublicMenuItem[];
};

export type PublicMenu = {
  id: number;
  key: string;
  version: number;
  title: string | null;
  items: PublicMenuItem[];
};

export type PublicMenusResponse = {
  locale: string;
  menus: Partial<Record<WebsiteMenuLocation, PublicMenu>>;
};
