export const userStatuses = [
  "active",
  "inactive",
  "locked",
  "suspended",
  "disabled",
] as const;

export type UserStatus = (typeof userStatuses)[number];

export type AccessRole = {
  id: number;
  key: string;
  name: string;
  isSystem?: boolean;
  permissionKeys?: string[];
};

export type AccessPermission = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  group: string;
};

export type UserLoyaltyTier = {
  id: number;
  key: string;
  name: string;
  iconKey: string | null;
  minimumValidViews: number;
};

export type UserMonetizationLevel = {
  id: number;
  key: string;
  name: string;
  status: string;
  isDefault: boolean;
};

export type MonetizationLevelOption = UserMonetizationLevel;

export type AdminUserListItem = {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  balance: string;
  status: UserStatus;
  role: string;
  roles: AccessRole[];
  directPermissions: string[];
  permissions: string[];
  loyaltyTier: UserLoyaltyTier | null;
  loyaltyCurrentValue: number;
  loyaltyWindowDays: number;
  monetizationLevel: UserMonetizationLevel | null;
  selectedMonetizationLevelId: number | null;
  usesDefaultMonetizationLevel: boolean;
  linksCount: number;
  activeSessionsCount: number;
  paymentMethodsCount: number;
  withdrawalsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminUser = AdminUserListItem;

export type AdminUserPaymentMethod = {
  id: number;
  paymentMethodId: number;
  name: string;
  status: string;
  details: Array<{ key: string; label: string; value: string }>;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserDetail = AdminUserListItem & {
  referralCode: string | null;
  referrer: { id: number; name: string; email: string } | null;
  storage: {
    limitBytes: string | null;
    usedBytes: string;
    reservedBytes: string;
  };
  socialAccounts: Array<{
    id: number;
    provider: string;
    connectedAt: string;
  }>;
  paymentMethods: AdminUserPaymentMethod[];
  relationshipCounts: {
    links: number;
    snippets: number;
    files: number;
    bioPages: number;
    paymentMethods: number;
    withdrawals: number;
    referrals: number;
    supportTickets: number;
    commissions: number;
    sessions: number;
  };
};

export type AdminUserSessionStatus = "active" | "revoked" | "expired";

export type AdminUserSession = {
  id: string;
  authMethod: "password" | "google" | string;
  ipAddress: string | null;
  userAgent: string | null;
  status: AdminUserSessionStatus;
  isCurrent: boolean;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
  lastActiveAt: string;
};

export type CreateAdminUserPayload = {
  name: string;
  email: string;
  avatar?: string;
  password: string;
  roles: string[];
  permissions: string[];
  status: UserStatus;
  monetizationLevelId?: number | null;
};

export type UpdateAdminUserPayload = {
  name?: string;
  email?: string;
  avatar?: string | null;
  roles?: string[];
  permissions?: string[];
  status?: UserStatus;
  monetizationLevelId?: number | null;
};

export type NestPaginatedUsersResponse = {
  items: AdminUserListItem[];
  data: AdminUserListItem[];
  total: number;
  page: number;
  limit: number;
  perPage: number;
  pageCount: number;
};

export type UsersTableData = {
  data: AdminUserListItem[];
  pageCount: number;
  total: number;
};

export type UsersAccessOptions = {
  roles: AccessRole[];
  permissions: AccessPermission[];
  monetizationLevels: MonetizationLevelOption[];
};
