export type AdminPermission = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  group: string;
};

export type AdminRole = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  usersCount: number;
  permissionKeys: string[];
  createdAt: string;
  updatedAt: string;
};

export type AuthorizationData = {
  roles: AdminRole[];
  permissions: AdminPermission[];
};

export type RolePayload = {
  key?: string;
  name: string;
  description: string;
  permissionKeys: string[];
};

