"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { useLocale } from "next-intl";

import { updateMemberCurrency } from "@/features/currencies/api/currencies.client";
import type {
  Currency,
  MemberCurrencyPreferences,
} from "@/features/currencies/types";

type FormatCurrencyOptions = {
  sourceCurrency?: string;
  targetCurrency?: string;
};

type MemberCurrencyContextValue = MemberCurrencyPreferences & {
  selectedCurrency: Currency;
  availableCurrencies: Currency[];
  convertCurrency: (
    value: number | string,
    sourceCurrency?: string,
    targetCurrency?: string,
  ) => number;
  formatCurrency: (
    value: number | string,
    options?: FormatCurrencyOptions,
  ) => string;
  selectCurrency: (currency: string) => Promise<void>;
};

const MemberCurrencyContext =
  createContext<MemberCurrencyContextValue | null>(null);

export function MemberCurrencyProvider({
  children,
  initialPreferences,
}: PropsWithChildren<{ initialPreferences: MemberCurrencyPreferences }>) {
  const locale = useLocale();
  const [preferences, setPreferences] = useState(initialPreferences);
  const availableCurrencies = useMemo(
    () => preferences.currencies.filter((currency) => currency.isActive),
    [preferences.currencies],
  );
  const selectedCurrency =
    availableCurrencies.find(
      (currency) => currency.code === preferences.currency,
    ) ??
    availableCurrencies.find(
      (currency) => currency.code === preferences.defaultCurrency,
    ) ??
    availableCurrencies[0];

  if (!selectedCurrency) {
    throw new Error("Không có tiền tệ khả dụng để hiển thị.");
  }

  const findCurrency = useCallback(
    (code: string) =>
      preferences.currencies.find((currency) => currency.code === code),
    [preferences.currencies],
  );

  const convertCurrency = useCallback(
    (
      value: number | string,
      sourceCurrency = preferences.baseCurrency,
      targetCurrency = preferences.currency,
    ) => {
      const amount = Number(value);
      if (!Number.isFinite(amount)) return 0;
      if (sourceCurrency === targetCurrency) return amount;
      const source = findCurrency(sourceCurrency);
      const target = findCurrency(targetCurrency);
      if (!source || !target) return amount;
      const sourceRate = Number(source.exchangeRate);
      const targetRate = Number(target.exchangeRate);
      if (
        !Number.isFinite(sourceRate) ||
        sourceRate <= 0 ||
        !Number.isFinite(targetRate) ||
        targetRate <= 0
      ) {
        return amount;
      }
      return (amount / sourceRate) * targetRate;
    },
    [
      findCurrency,
      preferences.baseCurrency,
      preferences.currency,
    ],
  );

  const formatCurrency = useCallback(
    (
      value: number | string,
      options: FormatCurrencyOptions = {},
    ) => {
      const targetCode = options.targetCurrency ?? preferences.currency;
      const target =
        findCurrency(targetCode) ??
        selectedCurrency;
      const converted = convertCurrency(
        value,
        options.sourceCurrency ?? preferences.baseCurrency,
        target.code,
      );
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: target.code,
        minimumFractionDigits: target.decimalDigits,
        maximumFractionDigits: target.decimalDigits,
      }).format(converted);
    },
    [
      convertCurrency,
      findCurrency,
      locale,
      preferences.baseCurrency,
      preferences.currency,
      selectedCurrency,
    ],
  );

  const selectCurrency = useCallback(async (currency: string) => {
    const next = await updateMemberCurrency(currency);
    setPreferences(next);
  }, []);

  const value = useMemo<MemberCurrencyContextValue>(
    () => ({
      ...preferences,
      selectedCurrency,
      availableCurrencies,
      convertCurrency,
      formatCurrency,
      selectCurrency,
    }),
    [
      availableCurrencies,
      convertCurrency,
      formatCurrency,
      preferences,
      selectCurrency,
      selectedCurrency,
    ],
  );

  return (
    <MemberCurrencyContext.Provider value={value}>
      {children}
    </MemberCurrencyContext.Provider>
  );
}

export function useMemberCurrency() {
  const context = useContext(MemberCurrencyContext);
  if (!context) {
    throw new Error(
      "useMemberCurrency phải được dùng bên trong MemberCurrencyProvider.",
    );
  }
  return context;
}
