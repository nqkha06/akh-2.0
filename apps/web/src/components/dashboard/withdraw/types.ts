export type WithdrawalStatus =
  | "processing"
  | "paid"
  | "failed"
  | "cancelled"
  | "verification_required";

export type PayoutMethod = {
  id: string;
  type: "bank" | "wallet" | "paypal";
  provider: string;
  accountHolder: string;
  maskedAccount: string;
  withdrawFee: number;
  minimumAmount: number;
};

export type WithdrawalTransaction = {
  id: string;
  createdAt: string;
  completedAt?: string;
  method: PayoutMethod;
  requestedAmount: number;
  feeAmount: number;
  netAmount: number;
  status: WithdrawalStatus;
  failureReason?: string;
  receiptUrl?: string;
  canCancel?: boolean;
};

export type WithdrawalEligibility = {
  eligible: boolean;
  reason?: "identity" | "method" | "minimum_balance" | "review" | "tax";
  message?: string;
  actionLabel?: string;
  actionHref?: string;
};

export type WithdrawalLimits = {
  minimum: number;
  maximum: number;
  remaining: number | null;
  remainingLabel?: string;
};

export type WithdrawalDashboardData = {
  currency: "VND";
  availableBalance: number;
  pendingBalance: number;
  totalReceived: number;
  payoutMethods: PayoutMethod[];
  defaultMethodId: string | null;
  eligibility: WithdrawalEligibility;
  limits: WithdrawalLimits;
  processingEstimate?: string;
  transactions: WithdrawalTransaction[];
};

export type WithdrawalEstimate = {
  requestedAmount: number;
  feeAmount: number | null;
  netAmount: number | null;
  processingEstimate?: string;
};

export type CreateWithdrawalPayload = {
  amount: number;
  payoutMethodId: string;
};

export interface WithdrawalDataSource {
  getDashboard(): Promise<WithdrawalDashboardData>;
  estimate(payload: CreateWithdrawalPayload): Promise<WithdrawalEstimate>;
  create(payload: CreateWithdrawalPayload): Promise<WithdrawalTransaction>;
}
