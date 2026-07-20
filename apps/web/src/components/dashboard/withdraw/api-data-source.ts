import {
  getMemberPaymentMethods,
} from "@/features/payment-methods/api/payment-methods.client";
import {
  getPaymentMethodTranslation,
  type UserPaymentMethod,
} from "@/features/payment-methods/types";

import type {
  CreateWithdrawalPayload,
  PayoutMethod,
  WithdrawalDataSource,
} from "./types";

let loadedMethods: PayoutMethod[] = [];

function firstDetail(
  account: UserPaymentMethod,
  pattern: RegExp,
  fallback = "",
) {
  const match = Object.entries(account.details).find(([key, value]) => {
    return pattern.test(key) && Boolean(value);
  });
  return match?.[1] ?? fallback;
}

function mask(value: string) {
  if (!value) return "Chưa có thông tin";
  if (value.length <= 4) return "••••";
  return `${"•".repeat(Math.min(8, value.length - 4))} ${value.slice(-4)}`;
}

function toPayoutMethod(
  account: UserPaymentMethod,
  locale: string,
  defaultLocale: string,
): PayoutMethod {
  const translation = getPaymentMethodTranslation(
    account.paymentMethod,
    locale,
    defaultLocale,
  );
  const allValues = Object.values(account.details).filter(Boolean);
  const accountHolder = firstDetail(
    account,
    /(holder|owner|account_name|full_name|name)/i,
    allValues[0] ?? "",
  );
  const identifier = firstDetail(
    account,
    /(account_number|number|email|phone|wallet|identifier|address)/i,
    allValues.find((value) => value !== accountHolder) ?? allValues[0] ?? "",
  );
  const provider = translation?.name || `Phương thức #${account.paymentMethodId}`;
  const normalizedProvider = provider.toLowerCase();

  return {
    id: String(account.id),
    type: normalizedProvider.includes("paypal")
      ? "paypal"
      : /(ví|wallet|momo|zalopay)/i.test(provider)
        ? "wallet"
        : "bank",
    provider,
    accountHolder,
    maskedAccount: mask(identifier),
    withdrawFee: Number(account.paymentMethod.withdrawFee) || 0,
    minimumAmount: Number(account.paymentMethod.minWithdrawAmount) || 0,
  };
}

export const withdrawalDataSource: WithdrawalDataSource = {
  async getDashboard() {
    const dashboard = await getMemberPaymentMethods();
    const locale =
      document.cookie
        .split("; ")
        .find((item) => item.startsWith("NEXT_LOCALE="))
        ?.split("=")[1] ?? dashboard.defaultLocale;
    loadedMethods = dashboard.accounts
      .filter((account) => account.paymentMethod.status === "active")
      .map((account) =>
        toPayoutMethod(account, locale, dashboard.defaultLocale),
      );
    const firstMethod = loadedMethods[0];

    return {
      currency: "VND",
      availableBalance: 0,
      pendingBalance: 0,
      totalReceived: 0,
      payoutMethods: loadedMethods,
      defaultMethodId: firstMethod?.id ?? null,
      eligibility: firstMethod
        ? { eligible: true }
        : {
            eligible: false,
            reason: "method",
            message:
              "Bạn cần thêm ít nhất một phương thức nhận tiền trước khi rút.",
            actionLabel: "Thiết lập trong tài khoản",
            actionHref: "/member/account#payment-method",
          },
      limits: {
        minimum: firstMethod?.minimumAmount ?? 0,
        maximum: 0,
        remaining: null,
      },
      transactions: [],
    };
  },

  async estimate({ amount, payoutMethodId }) {
    const method = loadedMethods.find(({ id }) => id === payoutMethodId);
    if (!method) {
      throw new Error("Phương thức nhận tiền không còn khả dụng.");
    }
    const feeAmount = Math.min(amount, method.withdrawFee);
    return {
      requestedAmount: amount,
      feeAmount,
      netAmount: Math.max(0, amount - feeAmount),
    };
  },

  async create(_payload: CreateWithdrawalPayload) {
    throw new Error(
      "Chức năng tạo yêu cầu rút tiền sẽ được mở khi module Withdraw được triển khai.",
    );
  },
};
