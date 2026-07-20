export type ReferralMember = {
  id: number;
  name: string;
  maskedEmail: string;
  avatar: string | null;
  status: string;
  joinedAt: string;
  successfulWithdrawals: number;
  lastCommissionAt: string | null;
  totalCommission: string;
};

export type ReferralCommission = {
  id: number;
  amount: string;
  rate: string;
  withdrawalId: number;
  createdAt: string;
  fromUser: {
    id: number;
    name: string;
    maskedEmail: string;
    avatar: string | null;
  };
};

export type ReferralsDashboard = {
  referralCode: string;
  referralPath: string;
  referralUrl: string;
  commissionRate: string;
  commissionBasis: "net_amount";
  summary: {
    totalReferrals: number;
    totalCommission: string;
    successfulWithdrawals: number;
  };
  referrals: ReferralMember[];
  recentCommissions: ReferralCommission[];
};

export type ReferralsDashboardApiResponse = Omit<
  ReferralsDashboard,
  "referralUrl"
>;
