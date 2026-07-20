import "server-only";

import { adaptUsersResponse } from "@/features/admin-users/api/users-response-adapter";
import { serializeUsersTableQuery } from "@/features/admin-users/api/users-query-serializer";
import type { UsersTableQuery } from "@/features/admin-users/query/users-search-params";
import type {
  NestPaginatedUsersResponse,
  UsersAccessOptions,
} from "@/features/admin-users/types";
import { getServerSession } from "@/lib/auth/server-session";

const apiUrl = process.env.API_INTERNAL_URL?.replace(/\/$/, "");

export async function getUsersTableData(state: UsersTableQuery) {
  const session = await getServerSession();
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

export async function getUsersAccessOptions() {
  const session = await getServerSession();
  if (!apiUrl || !session?.backendAccessToken) {
    throw new Error("Phiên quản trị không hợp lệ.");
  }
  const response = await fetch(`${apiUrl}/admin/users/access-options`, {
    headers: { Authorization: `Bearer ${session.backendAccessToken}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await readApiError(response));
  return (await response.json()) as UsersAccessOptions;
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
