import type {
  CreateWithdrawalPayload,
  WithdrawalDashboardData,
  WithdrawalDataSource,
  WithdrawalTransaction,
} from "./types";

const bankMethod = {
  id: "bank-vcb-4821",
  type: "bank" as const,
  provider: "Vietcombank",
  accountHolder: "Nguyễn Văn An",
  maskedAccount: "•••• 4821",
  verified: true,
  isDefault: true,
};

const initialTransactions: WithdrawalTransaction[] = [
  {
    id: "WD-240612-0182",
    createdAt: "2026-07-12T08:30:00+07:00",
    method: bankMethod,
    requestedAmount: 1_200_000,
    feeAmount: 25_000,
    netAmount: 1_175_000,
    status: "processing",
  },
  {
    id: "WD-240628-0104",
    createdAt: "2026-06-28T14:12:00+07:00",
    completedAt: "2026-06-30T10:05:00+07:00",
    method: bankMethod,
    requestedAmount: 8_000_000,
    feeAmount: 25_000,
    netAmount: 7_975_000,
    status: "paid",
  },
  {
    id: "WD-240515-0089",
    createdAt: "2026-05-15T09:45:00+07:00",
    completedAt: "2026-05-16T16:20:00+07:00",
    method: bankMethod,
    requestedAmount: 5_000_000,
    feeAmount: 25_000,
    netAmount: 4_975_000,
    status: "paid",
  },
  {
    id: "WD-240402-0051",
    createdAt: "2026-04-02T11:18:00+07:00",
    method: bankMethod,
    requestedAmount: 3_500_000,
    feeAmount: 25_000,
    netAmount: 3_475_000,
    status: "failed",
    failureReason: "Ngân hàng từ chối giao dịch. Vui lòng kiểm tra lại thông tin tài khoản nhận tiền.",
  },
];

let dashboard: WithdrawalDashboardData = {
  currency: "VND",
  availableBalance: 12_450_000,
  pendingBalance: 1_200_000,
  totalReceived: 38_900_000,
  payoutMethods: [bankMethod],
  defaultMethodId: bankMethod.id,
  eligibility: { eligible: true },
  limits: {
    minimum: 100_000,
    maximum: 20_000_000,
    remaining: 18_800_000,
    remainingLabel: "Còn lại trong ngày",
  },
  processingEstimate: "1–3 ngày làm việc",
  transactions: initialTransactions,
};

const wait = (duration: number) => new Promise((resolve) => setTimeout(resolve, duration));

/**
 * Adapter demo cho workspace hiện chưa có payout endpoint. UI chỉ phụ thuộc vào
 * WithdrawalDataSource, vì vậy có thể thay adapter này bằng API thật mà không đổi component.
 */
export const withdrawalDataSource: WithdrawalDataSource = {
  async getDashboard() {
    await wait(320);
    return structuredClone(dashboard);
  },
  async estimate({ amount }) {
    await wait(80);
    const feeAmount = amount > 0 ? 25_000 : null;
    return {
      requestedAmount: amount,
      feeAmount,
      netAmount: feeAmount === null ? null : Math.max(0, amount - feeAmount),
      processingEstimate: dashboard.processingEstimate,
    };
  },
  async create({ amount, payoutMethodId }: CreateWithdrawalPayload) {
    await wait(700);
    const method = dashboard.payoutMethods.find((item) => item.id === payoutMethodId);
    if (!method) throw new Error("Phương thức nhận tiền không còn khả dụng.");
    const feeAmount = 25_000;
    const transaction: WithdrawalTransaction = {
      id: `WD-${Date.now().toString().slice(-10)}`,
      createdAt: new Date().toISOString(),
      method,
      requestedAmount: amount,
      feeAmount,
      netAmount: Math.max(0, amount - feeAmount),
      status: "processing",
    };
    dashboard = {
      ...dashboard,
      availableBalance: dashboard.availableBalance - amount,
      pendingBalance: dashboard.pendingBalance + amount,
      transactions: [transaction, ...dashboard.transactions],
    };
    return structuredClone(transaction);
  },
};
