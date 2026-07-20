import type {
  MonetizationLevelsTableData,
  NestPaginatedMonetizationLevelsResponse,
} from "@/features/admin-monetization-levels/types";

export function adaptMonetizationLevelsResponse(
  response: NestPaginatedMonetizationLevelsResponse,
): MonetizationLevelsTableData {
  return {
    data: response.items,
    pageCount: Math.max(1, Math.ceil(response.total / response.limit)),
    total: response.total,
    summary: response.summary,
  };
}
