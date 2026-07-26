import "server-only";

import { serializeLoyaltyTiersQuery } from "@/features/admin-loyalty-tiers/api/loyalty-tiers-query-serializer";
import { adaptLoyaltyTiersResponse } from "@/features/admin-loyalty-tiers/api/loyalty-tiers-response-adapter";
import type { LoyaltyTiersTableQuery } from "@/features/admin-loyalty-tiers/query/loyalty-tiers-search-params";
import type {
  AdminLoyaltyTier,
  NestPaginatedLoyaltyTiersResponse,
} from "@/features/admin-loyalty-tiers/types";
import { serverApiFetch } from "@/lib/auth/server-access";

export async function getLoyaltyTiersTableData(
  state: LoyaltyTiersTableQuery,
) {
  const response = await serverApiFetch(
    `/admin/loyalty-tiers?${serializeLoyaltyTiersQuery(state)}`,
    { cache: "no-store" },
    "/admin/loyalty",
  );
  if (!response.ok) throw new Error(await readApiError(response));
  return adaptLoyaltyTiersResponse(
    (await response.json()) as NestPaginatedLoyaltyTiersResponse,
  );
}

export async function getLoyaltyTier(
  id: number,
): Promise<AdminLoyaltyTier | null> {
  const response = await serverApiFetch(
    `/admin/loyalty-tiers/${id}`,
    { cache: "no-store" },
    `/admin/loyalty/${id}/edit`,
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(await readApiError(response));
  return (await response.json()) as AdminLoyaltyTier;
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
