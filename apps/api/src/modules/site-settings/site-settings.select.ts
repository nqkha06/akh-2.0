import { Prisma } from "@prisma/client";

export const WEBSITE_SETTINGS_MEDIA_SELECT = {
  id: true,
  fileName: true,
  mimeType: true,
  extension: true,
  url: true,
} satisfies Prisma.AdminMediaSelect;

export const WEBSITE_SETTINGS_INCLUDE = {
  logoLight: { select: WEBSITE_SETTINGS_MEDIA_SELECT },
  logoDark: { select: WEBSITE_SETTINGS_MEDIA_SELECT },
  logoIcon: { select: WEBSITE_SETTINGS_MEDIA_SELECT },
  favicon: { select: WEBSITE_SETTINGS_MEDIA_SELECT },
  defaultOgImage: { select: WEBSITE_SETTINGS_MEDIA_SELECT },
} satisfies Prisma.WebsiteSettingsInclude;

export type WebsiteSettingsRecord = Prisma.WebsiteSettingsGetPayload<{
  include: typeof WEBSITE_SETTINGS_INCLUDE;
}>;

export type WebsiteSettingsMedia = Prisma.AdminMediaGetPayload<{
  select: typeof WEBSITE_SETTINGS_MEDIA_SELECT;
}>;
