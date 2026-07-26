import type {
  LoyaltyTiersTableData,
  NestPaginatedLoyaltyTiersResponse,
} from "@/features/admin-loyalty-tiers/types";

export function adaptLoyaltyTiersResponse(
  response: NestPaginatedLoyaltyTiersResponse,
): LoyaltyTiersTableData {
  return {
    data: response.items,
    pageCount: Math.max(1, Math.ceil(response.total / response.limit)),
    total: response.total,
    summary: response.summary,
  };
}
