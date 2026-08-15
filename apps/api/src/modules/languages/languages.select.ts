import { Prisma } from "@prisma/client";

export const LANGUAGE_RESPONSE_SELECT = {
  id: true,
  name: true,
  nativeName: true,
  locale: true,
  code: true,
  regional: true,
  flag: true,
  isDefault: true,
  status: true,
  isRtl: true,
  sortOrder: true,
  uiMessagesJson: true,
  uiCatalogSize: true,
  uiTranslationVersion: true,
  uiUpdatedAt: true,
} satisfies Prisma.LanguageSelect;

export type LanguageResponseRecord = Prisma.LanguageGetPayload<{
  select: typeof LANGUAGE_RESPONSE_SELECT;
}>;
