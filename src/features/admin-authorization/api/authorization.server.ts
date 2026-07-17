import "server-only";

import { auth } from "@/auth";
import type {
  AdminPermission,
  AdminRole,
  AuthorizationData,
} from "@/features/admin-authorization/types";

const apiUrl = (
  process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL
)?.replace(/\/$/, "");

export async function getAuthorizationData(): Promise<AuthorizationData> {
  const session = await auth();
  if (!apiUrl || !session?.backendAccessToken) {
    throw new Error("Phiên quản trị không hợp lệ.");
  }
  const headers = {
    Authorization: `Bearer ${session.backendAccessToken}`,
  };
  const [rolesResponse, permissionsResponse] = await Promise.all([
    fetch(`${apiUrl}/admin/roles`, { headers, cache: "no-store" }),
    fetch(`${apiUrl}/admin/permissions`, { headers, cache: "no-store" }),
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

