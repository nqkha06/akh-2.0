import type {
  AdminSocialLinksTableData,
  NestPaginatedAdminSocialLinksResponse,
} from "@/features/admin-social-links/types"

export function adaptAdminSocialLinksResponse(
  response: NestPaginatedAdminSocialLinksResponse,
): AdminSocialLinksTableData {
  return {
    data: response.items,
    pageCount: Math.max(1, Math.ceil(response.total / response.limit)),
    total: response.total,
    totalViews: response.totalViews,
  }
}
