import type { Currency } from "@prisma/client";

export function mapCurrencyResponse(currency: Currency) {
  return {
    ...currency,
    exchangeRate: currency.exchangeRate.toString(),
  };
}

export function parseUserCurrencyMeta(value: string | undefined) {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === "string" ? parsed : null;
  } catch {
    return null;
  }
}
