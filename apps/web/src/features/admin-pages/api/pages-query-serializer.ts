import type { AdminPagesTableQuery } from "@/features/admin-pages/query/pages-search-params";
import { getValidFilters } from "@/lib/data-table";

export function serializeAdminPagesQuery(state: AdminPagesTableQuery) {
  const query = new URLSearchParams({
    page: String(state.page),
    perPage: String(state.perPage),
    sort: JSON.stringify(state.sort),
    filters: JSON.stringify(getValidFilters(state.filters)),
    joinOperator: state.joinOperator,
  });
  if (state.search) query.set("search", state.search);
  if (state.status.length) query.set("status", state.status.join(","));
  return query.toString();
}
