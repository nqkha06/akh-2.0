import type { AdminSocialLinksTableQuery } from "@/features/admin-social-links/query/social-links-search-params"
import { getValidFilters } from "@/lib/data-table"

export function serializeAdminSocialLinksQuery(
  state: AdminSocialLinksTableQuery,
) {
  const query = new URLSearchParams({
    page: String(state.page),
    perPage: String(state.perPage),
    sort: JSON.stringify(state.sort),
    filters: JSON.stringify(getValidFilters(state.filters)),
    joinOperator: state.joinOperator,
  })

  if (state.title) query.set("title", state.title)
  if (state.owner) query.set("owner", state.owner)
  if (state.userId) query.set("userId", String(state.userId))
  if (state.status.length) query.set("status", state.status.join(","))
  if (state.destinationType.length) {
    query.set("destinationType", state.destinationType.join(","))
  }
  if (state.deletedState.length) {
    query.set("deletedState", state.deletedState.join(","))
  }

  return query.toString()
}
