import type { UsersTableQuery } from "@/features/admin-users/query/users-search-params";
import { getValidFilters } from "@/lib/data-table";

export function serializeUsersTableQuery(state: UsersTableQuery) {
  const query = new URLSearchParams({
    page: String(state.page),
    perPage: String(state.perPage),
    sort: JSON.stringify(state.sort),
    filters: JSON.stringify(getValidFilters(state.filters)),
    joinOperator: state.joinOperator,
  });

  if (state.name) query.set("name", state.name);
  if (state.email) query.set("email", state.email);
  if (state.role.length) query.set("role", state.role.join(","));
  if (state.status.length) query.set("status", state.status.join(","));
  if (state.emailVerified) query.set("emailVerified", state.emailVerified);

  return query.toString();
}
