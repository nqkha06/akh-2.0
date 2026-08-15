import { Prisma } from "@prisma/client";

export const BUSINESS_CURRENCY_SELECT = {
  id: true,
  code: true,
  name: true,
  symbol: true,
  exchangeRate: true,
  isBase: true,
  isDefault: true,
  isActive: true,
} satisfies Prisma.CurrencySelect;

export type BusinessCurrencyRecord = Prisma.CurrencyGetPayload<{
  select: typeof BUSINESS_CURRENCY_SELECT;
}>;
