import "server-only";

import type {
  AdminPermission,
  AdminRole,
  AuthorizationData,
} from "@/features/admin-authorization/types";
import { serverApiFetch } from "@/lib/auth/server-access";

export async function getAuthorizationData(): Promise<AuthorizationData> {
  const [rolesResponse, permissionsResponse] = await Promise.all([
    serverApiFetch("/admin/roles", {}, "/admin/roles"),
    serverApiFetch("/admin/permissions", {}, "/admin/roles"),
  ]);
  if (!rolesResponse.ok) throw new Error(await readApiError(rolesResponse));
  if (!permissionsResponse.ok) {
    throw new Error(await readApiError(permissionsResponse));
  }
  return {
    roles: (await rolesResponse.json()) as AdminRole[],
    permissions: (await permissionsResponse.json()) as AdminPermission[],
  };
}

async function readApiError(response: Response) {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    return Array.isArray(body.message)
      ? body.message.join(", ")
      : body.message || `Request failed with ${response.status}`;
  } catch {
    return `Request failed with ${response.status}`;
  }
}
