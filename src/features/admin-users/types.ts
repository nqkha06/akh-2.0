export type AdminUser = {
  id: number;
  name: string;
  email: string;
  emailVerifiedAt: string | null;
  emailVerified: boolean;
  avatar: string | null;
  status: string;
  role: string;
  roles: AccessRole[];
  directPermissions: string[];
  permissions: string[];
  linksCount: number;
  activeSessionsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserPayload = {
  name: string;
  email: string;
  password?: string;
  roles: string[];
  permissions: string[];
  status: "active" | "inactive" | "locked" | "suspended" | "disabled";
};

export type NestPaginatedUsersResponse = {
  items: AdminUser[];
  total: number;
  page: number;
  limit: number;
};

export type UsersTableData = {
  data: AdminUser[];
  pageCount: number;
  total: number;
};

export type AccessRole = {
  id: number;
  key: string;
  name: string;
  isSystem?: boolean;
};

export type AccessPermission = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  group: string;
};

export type UsersAccessOptions = {
  roles: AccessRole[];
  permissions: AccessPermission[];
};
