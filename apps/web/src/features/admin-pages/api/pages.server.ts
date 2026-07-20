import "server-only";

import { serializeAdminPagesQuery } from "@/features/admin-pages/api/pages-query-serializer";
import { adaptAdminPagesResponse } from "@/features/admin-pages/api/pages-response-adapter";
import type { AdminPagesTableQuery } from "@/features/admin-pages/query/pages-search-params";
import type {
  AdminPage,
  NestPaginatedPagesResponse,
} from "@/features/admin-pages/types";
import { serverApiFetch } from "@/lib/auth/server-access";

export async function getAdminPagesTableData(state: AdminPagesTableQuery) {
  const response = await serverApiFetch(
    `/admin/pages?${serializeAdminPagesQuery(state)}`,
    { cache: "no-store" },
    "/admin/pages",
  );
  if (!response.ok) throw new Error(await readApiError(response));
  return adaptAdminPagesResponse(
    (await response.json()) as NestPaginatedPagesResponse,
  );
}

export async function getAdminPage(id: number) {
  const response = await serverApiFetch(
    `/admin/pages/${id}`,
    { cache: "no-store" },
    `/admin/pages/${id}`,
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(await readApiError(response));
  return (await response.json()) as AdminPage;
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
