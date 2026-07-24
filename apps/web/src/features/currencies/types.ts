export type Currency = {
  id: number;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: string;
  decimalDigits: number;
  isBase: boolean;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type CurrencyPayload = {
  code: string;
  name: string;
  symbol: string;
  exchangeRate: string;
  decimalDigits: number;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
};

export type AdminCurrenciesResponse = {
  items: Currency[];
  total: number;
  baseCurrency: string;
  defaultCurrency: string;
};

export type MemberCurrencyPreferences = {
  currency: string;
  baseCurrency: string;
  defaultCurrency: string;
  currencies: Currency[];
};
