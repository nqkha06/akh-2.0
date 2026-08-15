import { Prisma } from "@prisma/client";

export const PAYMENT_METHOD_TRANSLATIONS_INCLUDE = {
  translations: { orderBy: { locale: "asc" } },
} satisfies Prisma.PaymentMethodInclude;

export const PAYMENT_METHOD_INCLUDE = {
  ...PAYMENT_METHOD_TRANSLATIONS_INCLUDE,
  _count: { select: { userMethods: true } },
} satisfies Prisma.PaymentMethodInclude;

export const USER_PAYMENT_METHOD_INCLUDE = {
  paymentMethod: {
    include: PAYMENT_METHOD_TRANSLATIONS_INCLUDE,
  },
} satisfies Prisma.UserPaymentMethodInclude;

export type PaymentMethodRecord = Prisma.PaymentMethodGetPayload<{
  include: typeof PAYMENT_METHOD_INCLUDE;
}>;

export type PaymentMethodCatalogRecord = Prisma.PaymentMethodGetPayload<{
  include: typeof PAYMENT_METHOD_TRANSLATIONS_INCLUDE;
}>;

export type UserPaymentMethodRecord = Prisma.UserPaymentMethodGetPayload<{
  include: typeof USER_PAYMENT_METHOD_INCLUDE;
}>;
