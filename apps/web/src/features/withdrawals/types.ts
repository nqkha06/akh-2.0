export type WithdrawalStatus =
  | "pending"
  | "processing"
  | "paid"
  | "rejected"
  | "cancelled";

export type WithdrawalParty = {
  id: number;
  name: string;
  email: string;
};

export type AdminWithdrawal = {
  id: number;
  currency: string;
  amount: string;
  feeAmount: string;
  netAmount: string;
  status: WithdrawalStatus;
  statusReason: string | null;
  trafficSource: string | null;
  userPaymentMethodId: number | null;
  paymentMethod: {
    id: number;
    name: string;
    details: Record<string, string>;
  };
  user: WithdrawalParty;
  processedBy: WithdrawalParty | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
  canCancel: boolean;
};

export type AdminWithdrawalsResponse = {
  items: AdminWithdrawal[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
};

export type AdminWithdrawalsTableData = {
  data: AdminWithdrawal[];
  total: number;
  pageCount: number;
};
