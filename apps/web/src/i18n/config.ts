export type AppLocale = string;

export const defaultLocale = "vi";
export const localeCookieName = "NEXT_LOCALE";

export function isLocaleSyntax(value: string | undefined): value is AppLocale {
  return Boolean(value && /^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(value));
}
