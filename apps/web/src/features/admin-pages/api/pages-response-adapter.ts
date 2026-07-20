import type {
  AdminPagesTableData,
  NestPaginatedPagesResponse,
} from "@/features/admin-pages/types";

export function adaptAdminPagesResponse(
  response: NestPaginatedPagesResponse,
): AdminPagesTableData {
  return {
    data: response.items,
    pageCount: response.pageCount,
    total: response.total,
  };
}
