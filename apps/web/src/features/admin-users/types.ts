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

export type AdminUserListItem = {
  id: number;
  name: string;
  email: string;
  emailVerifiedAt: string | null;
  emailVerified: boolean;
  avatar: string | null;
  balance: string;
  status: UserStatus;
  role: string;
  roles: AccessRole[];
  directPermissions: string[];
  permissions: string[];
  linksCount: number;
  activeSessionsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminUser = AdminUserListItem;
export type AdminUserDetail = AdminUserListItem;

export type CreateAdminUserPayload = {
  name: string;
  email: string;
  avatar?: string;
  password: string;
  roles: string[];
  permissions: string[];
  status: UserStatus;
  emailVerified: boolean;
};

export type UpdateAdminUserPayload = {
  name?: string;
  email?: string;
  avatar?: string | null;
  roles?: string[];
  permissions?: string[];
  status?: UserStatus;
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
};
