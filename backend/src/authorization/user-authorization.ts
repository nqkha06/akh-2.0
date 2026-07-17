export type UserAuthorizationRecord = {
  roles: Array<{
    role: {
      key: string;
      permissions: Array<{ permission: { key: string } }>;
    };
  }>;
  permissions: Array<{ permission: { key: string } }>;
};

export const userAuthorizationInclude = {
  roles: {
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  },
  permissions: { include: { permission: true } },
} as const;

export function resolveUserAuthorization(user: UserAuthorizationRecord) {
  const roles = user.roles
    .map((assignment) => assignment.role.key)
    .sort((left, right) => {
      if (left === "admin") return -1;
      if (right === "admin") return 1;
      if (left === "member") return 1;
      if (right === "member") return -1;
      return left.localeCompare(right);
    });
  const permissions = new Set(
    user.permissions.map((assignment) => assignment.permission.key),
  );
  for (const assignment of user.roles) {
    for (const rolePermission of assignment.role.permissions) {
      permissions.add(rolePermission.permission.key);
    }
  }

  return {
    role: roles[0] || "member",
    roles,
    permissions: [...permissions].sort(),
  };
}

