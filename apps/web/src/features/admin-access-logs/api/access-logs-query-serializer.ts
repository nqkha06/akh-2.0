import type { AccessLogsTableQuery } from "../query/access-logs-search-params";

export function serializeAccessLogsQuery(state: AccessLogsTableQuery) {
  const query = new URLSearchParams({
    page: String(state.page),
    perPage: String(state.perPage),
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
  });
  const values: Array<[string, string | number | boolean | null | undefined]> = [
    ["from", state.from],
    ["to", state.to],
    ["userId", state.userId],
    ["user", state.user],
    ["linkId", state.linkId],
    ["link", state.link],
    ["ip", state.ip],
    ["country", state.country],
    ["device", state.device],
    ["isEarn", state.isEarn],
    ["hasRevenue", state.hasRevenue],
    ["detectionMask", state.detectionMask],
    ["rejectReasonMask", state.rejectReasonMask],
    ["state", state.state],
    ["reviewStatus", state.reviewStatus],
  ];
  for (const [key, value] of values) {
    if (value !== null && value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  }
  return query.toString();
}
