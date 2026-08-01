import type { WithdrawalsTableQuery } from "@/features/withdrawals/query/withdrawals-search-params";

const sortableColumns = new Set([
  "id",
  "amount",
  "netAmount",
  "status",
  "createdAt",
  "processedAt",
]);

export function serializeWithdrawalsTableQuery(
  state: WithdrawalsTableQuery,
) {
  const primarySort = state.sort[0];
  const sortBy =
    primarySort && sortableColumns.has(primarySort.id)
      ? primarySort.id
      : "createdAt";

  const query = new URLSearchParams({
    page: String(state.page),
    perPage: String(state.perPage),
    sortBy,
    sortOrder: primarySort?.desc === false ? "asc" : "desc",
  });

  if (state.member.trim()) query.set("search", state.member.trim());
  if (state.userId) query.set("userId", String(state.userId));
  if (state.status.length) query.set("status", state.status.join(","));

  return query.toString();
}
