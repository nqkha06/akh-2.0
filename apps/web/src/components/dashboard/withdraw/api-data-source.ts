import { authenticatedApiFetch } from "@/lib/api-client";

import type {
  PayoutMethod,
  WithdrawalDataSource,
  WithdrawalStatus,
  WithdrawalTransaction,
} from "./types";

type RawAccount = {
  id: number;
  details: Record<string, string>;
  paymentMethod: {
    id: number;
    withdrawFee: string;
    minWithdrawAmount: string;
    status: string;
    translations: Array<{ locale: string; name: string }>;
  };
};

type RawWithdrawal = {
  id: number;
  amount: string;
  feeAmount: string;
  netAmount: string;
  status: WithdrawalStatus;
  statusReason: string | null;
  processedAt: string | null;
  createdAt: string;
  canCancel: boolean;
  paymentMethod: {
    id: number;
    name: string;
    details: Record<string, string>;
  };
};

type RawDashboard = {
  currency: string;
  requireTrafficSource: boolean;
  availableBalance: string;
  pendingBalance: string;
  totalReceived: string;
  accounts: RawAccount[];
  withdrawals: RawWithdrawal[];
};

async function getError(response: Response) {
  try {
    const payload = (await response.json()) as {
      message?: string | string[];
      error?: string;
    };
    return Array.isArray(payload.message)
      ? payload.message.join(", ")
      : payload.message || payload.error || "";
  } catch {
    return "";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await authenticatedApiFetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...Object.fromEntries(new Headers(init?.headers).entries()),
    },
  });
  if (!response.ok) throw new Error(await getError(response));
  return (await response.json()) as T;
}

function firstDetail(
  details: Record<string, string>,
  pattern: RegExp,
  fallback = "",
) {
  return (
    Object.entries(details).find(
      ([key, value]) => pattern.test(key) && Boolean(value),
    )?.[1] ?? fallback
  );
}

function mask(value: string) {
  if (!value) return "—";
  if (value.includes("•")) return value;
  if (value.length <= 4) return "••••";
  return `${"•".repeat(Math.min(8, value.length - 4))} ${value.slice(-4)}`;
}

function methodType(provider: string): PayoutMethod["type"] {
  if (provider.toLowerCase().includes("paypal")) return "paypal";
  if (/(ví|wallet|momo|zalopay)/i.test(provider)) return "wallet";
  return "bank";
}

function translatedMethodName(
  paymentMethod: RawAccount["paymentMethod"],
  locale: string,
) {
  return (
    paymentMethod.translations.find(
      (translation) => translation.locale === locale,
    )?.name ||
    paymentMethod.translations.find(
      (translation) => translation.locale === locale.split("-")[0],
    )?.name ||
    paymentMethod.translations.find(
      (translation) => translation.locale === "vi",
    )?.name ||
    paymentMethod.translations[0]?.name ||
    `#${paymentMethod.id}`
  );
}

function toPayoutMethod(account: RawAccount, locale: string): PayoutMethod {
  const provider = translatedMethodName(account.paymentMethod, locale);
  const values = Object.values(account.details).filter(Boolean);
  const accountHolder = firstDetail(
    account.details,
    /(holder|owner|account_name|full_name|name)/i,
    values[0] ?? "",
  );
  const identifier = firstDetail(
    account.details,
    /(account_number|number|email|phone|wallet|identifier|address)/i,
    values.find((value) => value !== accountHolder) ?? values[0] ?? "",
  );
  return {
    id: String(account.id),
    type: methodType(provider),
    provider,
    accountHolder,
    maskedAccount: mask(identifier),
    withdrawFee: Number(account.paymentMethod.withdrawFee) || 0,
    minimumAmount: Number(account.paymentMethod.minWithdrawAmount) || 0,
  };
}

function toTransaction(
  raw: RawWithdrawal,
  accounts: RawAccount[],
  locale: string,
): WithdrawalTransaction {
  const values = Object.values(raw.paymentMethod.details).filter(Boolean);
  const accountHolder = firstDetail(
    raw.paymentMethod.details,
    /(holder|owner|account_name|full_name|name)/i,
    values[0] ?? "",
  );
  const identifier = firstDetail(
    raw.paymentMethod.details,
    /(account_number|number|email|phone|wallet|identifier|address)/i,
    values.find((value) => value !== accountHolder) ?? values[0] ?? "",
  );
  const configuredMethod = accounts.find(
    (account) => account.paymentMethod.id === raw.paymentMethod.id,
  )?.paymentMethod;
  const provider = configuredMethod
    ? translatedMethodName(configuredMethod, locale)
    : raw.paymentMethod.name;
  return {
    id: String(raw.id),
    createdAt: raw.createdAt,
    completedAt: raw.processedAt ?? undefined,
    method: {
      id: String(raw.paymentMethod.id),
      type: methodType(provider),
      provider,
      accountHolder,
      maskedAccount: mask(identifier),
      withdrawFee: Number(raw.feeAmount),
      minimumAmount: 0,
    },
    requestedAmount: Number(raw.amount),
    feeAmount: Number(raw.feeAmount),
    netAmount: Number(raw.netAmount),
    status: raw.status,
    failureReason: raw.statusReason ?? undefined,
    canCancel: raw.canCancel,
  };
}

let loadedMethods: PayoutMethod[] = [];
let loadedAccounts: RawAccount[] = [];
let loadedLocale = "vi";

export const withdrawalDataSource: WithdrawalDataSource = {
  async getDashboard() {
    const dashboard = await request<RawDashboard>(
      "/member/withdrawals/dashboard",
    );
    const locale =
      document.cookie
        .split("; ")
        .find((item) => item.startsWith("NEXT_LOCALE="))
        ?.split("=")[1] ?? "vi";
    loadedAccounts = dashboard.accounts;
    loadedLocale = locale;
    loadedMethods = dashboard.accounts.map((account) =>
      toPayoutMethod(account, locale),
    );
    const availableBalance = Number(dashboard.availableBalance);
    const firstMethod = loadedMethods[0];
    return {
      currency: dashboard.currency,
      requireTrafficSource: dashboard.requireTrafficSource,
      availableBalance,
      pendingBalance: Number(dashboard.pendingBalance),
      totalReceived: Number(dashboard.totalReceived),
      payoutMethods: loadedMethods,
      defaultMethodId: firstMethod?.id ?? null,
      eligibility: firstMethod
        ? { eligible: true }
        : {
            eligible: false,
            reason: "method",
            actionHref: "/member/account#payment-method",
          },
      limits: {
        minimum: firstMethod?.minimumAmount ?? 0,
        maximum: availableBalance,
        remaining: null,
      },
      transactions: dashboard.withdrawals.map((withdrawal) =>
        toTransaction(withdrawal, dashboard.accounts, locale),
      ),
    };
  },

  async estimate({ amount, payoutMethodId }) {
    const response = await request<{
      requestedAmount: string;
      feeAmount: string;
      netAmount: string;
    }>("/member/withdrawals/estimate", {
      method: "POST",
      body: JSON.stringify({
        amount: String(amount),
        userPaymentMethodId: Number(payoutMethodId),
      }),
    });
    return {
      requestedAmount: Number(response.requestedAmount),
      feeAmount: Number(response.feeAmount),
      netAmount: Number(response.netAmount),
    };
  },

  async create({ amount, payoutMethodId, idempotencyKey, trafficSource }) {
    const response = await request<RawWithdrawal>("/member/withdrawals", {
      method: "POST",
      body: JSON.stringify({
        amount: String(amount),
        userPaymentMethodId: Number(payoutMethodId),
        idempotencyKey,
        trafficSource,
      }),
    });
    return toTransaction(response, loadedAccounts, loadedLocale);
  },

  async cancel(id) {
    return toTransaction(
      await request<RawWithdrawal>(`/member/withdrawals/${id}/cancel`, {
        method: "PATCH",
      }),
      loadedAccounts,
      loadedLocale,
    );
  },
};
