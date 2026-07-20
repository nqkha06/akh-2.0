"use client";

import * as React from "react";

const AdminPermissionsContext = React.createContext<readonly string[]>([]);

export function AdminAuthorizationProvider({
  permissions,
  children,
}: {
  permissions: string[];
  children: React.ReactNode;
}) {
  return (
    <AdminPermissionsContext.Provider value={permissions}>
      {children}
    </AdminPermissionsContext.Provider>
  );
}

export function useAdminPermissions() {
  return React.useContext(AdminPermissionsContext);
}

