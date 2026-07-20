import "server-only";

import { serializeMonetizationLevelsQuery } from "@/features/admin-monetization-levels/api/monetization-levels-query-serializer";
import { adaptMonetizationLevelsResponse } from "@/features/admin-monetization-levels/api/monetization-levels-response-adapter";
import type { MonetizationLevelsTableQuery } from "@/features/admin-monetization-levels/query/monetization-levels-search-params";
import type {
  AdminMonetizationLevel,
  NestPaginatedMonetizationLevelsResponse,
} from "@/features/admin-monetization-levels/types";
import { serverApiFetch } from "@/lib/auth/server-access";

export async function getMonetizationLevelsTableData(
  state: MonetizationLevelsTableQuery,
) {
  const response = await serverApiFetch(
    `/admin/monetization-levels?${serializeMonetizationLevelsQuery(state)}`,
    {
      cache: "no-store",
    },
    "/admin/monetization-levels",
  );
  if (!response.ok) throw new Error(await readApiError(response));

  return adaptMonetizationLevelsResponse(
    (await response.json()) as NestPaginatedMonetizationLevelsResponse,
  );
}

export async function getMonetizationLevel(
  id: number,
): Promise<AdminMonetizationLevel | null> {
  const response = await serverApiFetch(
    `/admin/monetization-levels/${id}`,
    { cache: "no-store" },
    `/admin/monetization-levels/${id}/edit`,
  );

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(await readApiError(response));

  return (await response.json()) as AdminMonetizationLevel;
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
