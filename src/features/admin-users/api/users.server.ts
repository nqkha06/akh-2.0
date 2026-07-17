import "server-only";

import { auth } from "@/auth";
import { adaptUsersResponse } from "@/features/admin-users/api/users-response-adapter";
import { serializeUsersTableQuery } from "@/features/admin-users/api/users-query-serializer";
import type { UsersTableQuery } from "@/features/admin-users/query/users-search-params";
import type { NestPaginatedUsersResponse } from "@/features/admin-users/types";

const apiUrl = (
  process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL
)?.replace(/\/$/, "");

export async function getUsersTableData(state: UsersTableQuery) {
  const session = await auth();
  if (!apiUrl || !session?.backendAccessToken) {
    throw new Error("Phiên quản trị không hợp lệ.");
  }

  const response = await fetch(
    `${apiUrl}/admin/users?${serializeUsersTableQuery(state)}`,
    {
      headers: { Authorization: `Bearer ${session.backendAccessToken}` },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return adaptUsersResponse(
    (await response.json()) as NestPaginatedUsersResponse,
  );
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
