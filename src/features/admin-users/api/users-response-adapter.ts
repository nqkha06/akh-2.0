import type {
  NestPaginatedUsersResponse,
  UsersTableData,
} from "@/features/admin-users/types";

export function adaptUsersResponse(
  response: NestPaginatedUsersResponse,
): UsersTableData {
  return {
    data: response.items,
    pageCount: Math.ceil(response.total / response.limit),
    total: response.total,
  };
}
