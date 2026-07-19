import type { MonetizationLevelsTableQuery } from "@/features/admin-monetization-levels/query/monetization-levels-search-params";
import { getValidFilters } from "@/lib/data-table";

export function serializeMonetizationLevelsQuery(
  state: MonetizationLevelsTableQuery,
) {
  const filters = getValidFilters(state.filters);
  const searchFilter = filters.find((filter) => filter.id === "key");
  const statusFilter = filters.find((filter) => filter.id === "status");
  const query = new URLSearchParams({
    page: String(state.page),
    perPage: String(state.perPage),
    sort: JSON.stringify(state.sort),
  });

  if (typeof searchFilter?.value === "string" && searchFilter.value.trim()) {
    query.set("name", searchFilter.value.trim());
  }
  const filteredStatuses = Array.isArray(statusFilter?.value)
    ? statusFilter.value
    : [];
  const statuses = state.status.length ? state.status : filteredStatuses;
  if (statuses.length) query.set("status", statuses.join(","));

  return query.toString();
}
