import type { LanguageResponseRecord } from "./languages.select";

export function parseLanguageUiMessages(value: string) {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );
  } catch {
    return {};
  }
}

function mapLanguageBase(language: LanguageResponseRecord) {
  const messages = parseLanguageUiMessages(language.uiMessagesJson);
  return {
    id: language.id,
    name: language.name,
    nativeName: language.nativeName,
    locale: language.locale,
    code: language.code,
    regional: language.regional,
    flag: language.flag,
    isDefault: language.isDefault,
    sortOrder: language.sortOrder,
    isRtl: language.isRtl,
    uiTranslation: {
      translatedKeys: Object.keys(messages).length,
      catalogSize: language.uiCatalogSize,
      version: language.uiTranslationVersion,
      updatedAt: language.uiUpdatedAt,
    },
  };
}

export function mapLanguageResponse(
  language: LanguageResponseRecord,
  includeStatus: true,
): ReturnType<typeof mapLanguageBase> & { status: string };
export function mapLanguageResponse(
  language: LanguageResponseRecord,
  includeStatus: false,
): ReturnType<typeof mapLanguageBase>;
export function mapLanguageResponse(
  language: LanguageResponseRecord,
  includeStatus: boolean,
) {
  const response = mapLanguageBase(language);
  return includeStatus ? { ...response, status: language.status } : response;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
