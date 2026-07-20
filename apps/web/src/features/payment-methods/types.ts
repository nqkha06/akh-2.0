import type { PublicationStatus } from "@/types/publication-status";

export type PaymentMethodFieldType =
  | "text"
  | "email"
  | "tel"
  | "number"
  | "textarea";

export type PaymentMethodField = {
  key: string;
  label: string;
  type: PaymentMethodFieldType;
  required: boolean;
  placeholder?: string;
};

export type PaymentMethodTranslation = {
  locale: string;
  name: string;
  fields: PaymentMethodField[];
};

export type PaymentMethod = {
  id: number;
  withdrawFee: string;
  minWithdrawAmount: string;
  status: PublicationStatus;
  translations: PaymentMethodTranslation[];
  userMethodCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type PaymentMethodPayload = {
  withdrawFee: string;
  minWithdrawAmount: string;
  status: PublicationStatus;
  translations: PaymentMethodTranslation[];
};

export type UserPaymentMethod = {
  id: number;
  paymentMethodId: number;
  details: Record<string, string>;
  paymentMethod: PaymentMethod;
  createdAt: string;
  updatedAt: string;
};

export type MemberPaymentMethodsDashboard = {
  defaultLocale: string;
  catalog: PaymentMethod[];
  accounts: UserPaymentMethod[];
};

export function getPaymentMethodTranslation(
  method: PaymentMethod,
  locale = "vi",
  defaultLocale = "vi",
) {
  const normalized = locale.toLowerCase();
  return (
    method.translations.find(
      (translation) => translation.locale.toLowerCase() === normalized,
    ) ??
    method.translations.find(
      (translation) =>
        translation.locale.toLowerCase() === normalized.split("-")[0],
    ) ??
    method.translations.find(
      (translation) => translation.locale === defaultLocale,
    ) ??
    method.translations.find(
      (translation) =>
        translation.locale === defaultLocale.split("-")[0],
    ) ??
    method.translations.find((translation) => translation.locale === "en") ??
    method.translations[0]
  );
}
