import "server-only";

import { adaptUsersResponse } from "@/features/admin-users/api/users-response-adapter";
import { serializeUsersTableQuery } from "@/features/admin-users/api/users-query-serializer";
import type { UsersTableQuery } from "@/features/admin-users/query/users-search-params";
import type {
  AdminUserDetail,
  NestPaginatedUsersResponse,
  UsersAccessOptions,
} from "@/features/admin-users/types";
import { serverApiFetch } from "@/lib/auth/server-access";

export async function getUsersTableData(state: UsersTableQuery) {
  const response = await serverApiFetch(
    `/admin/users?${serializeUsersTableQuery(state)}`,
    {
      cache: "no-store",
    },
    "/admin/users",
  );

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return adaptUsersResponse(
    (await response.json()) as NestPaginatedUsersResponse,
  );
}

export async function getUsersAccessOptions() {
  const response = await serverApiFetch(
    "/admin/users/access-options",
    { cache: "no-store" },
    "/admin/users",
  );
  if (!response.ok) throw new Error(await readApiError(response));
  return (await response.json()) as UsersAccessOptions;
}

export async function getAdminUser(id: number) {
  const response = await serverApiFetch(
    `/admin/users/${id}`,
    { cache: "no-store" },
    `/admin/users/${id}`,
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(await readApiError(response));
  return (await response.json()) as AdminUserDetail;
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
