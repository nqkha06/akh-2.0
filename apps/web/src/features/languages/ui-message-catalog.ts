import enMessages from "../../../messages/en.json";
import viMessages from "../../../messages/vi.json";

export type FlatMessages = Record<string, string>;

export const englishUiMessages = flattenMessages(enMessages);
export const vietnameseUiMessages = flattenMessages(viMessages);

export const uiMessageCatalog = Object.keys(englishUiMessages)
  .sort((left, right) => left.localeCompare(right))
  .map((key) => ({
    key,
    namespace: key.split(".")[0],
    english: englishUiMessages[key],
    vietnamese: vietnameseUiMessages[key] || "",
  }));

export function bundledMessagesFor(locale: string): FlatMessages | null {
  if (locale === "en") return englishUiMessages;
  if (locale === "vi") return vietnameseUiMessages;
  return null;
}

function flattenMessages(
  source: Record<string, unknown>,
  prefix = "",
  output: FlatMessages = {},
) {
  for (const [key, value] of Object.entries(source)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      flattenMessages(value as Record<string, unknown>, path, output);
    } else if (typeof value === "string") {
      output[path] = value;
    }
  }
  return output;
}
