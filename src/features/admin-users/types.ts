export type AdminUser = {
  id: number;
  name: string;
  email: string;
  emailVerifiedAt: string | null;
  emailVerified: boolean;
  avatar: string | null;
  status: string;
  role: string;
  linksCount: number;
  activeSessionsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserPayload = {
  name: string;
  email: string;
  password?: string;
  role: "admin" | "member";
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
