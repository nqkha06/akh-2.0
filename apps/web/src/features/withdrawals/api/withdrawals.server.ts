import "server-only";

import { serializeWithdrawalsTableQuery } from "@/features/withdrawals/api/withdrawals-query-serializer";
import type { WithdrawalsTableQuery } from "@/features/withdrawals/query/withdrawals-search-params";
import type {
  AdminWithdrawalsResponse,
  AdminWithdrawalsTableData,
} from "@/features/withdrawals/types";
import { serverApiFetch } from "@/lib/auth/server-access";

export async function getAdminWithdrawalsTableData(
  state: WithdrawalsTableQuery,
): Promise<AdminWithdrawalsTableData> {
  const response = await serverApiFetch(
    `/admin/withdrawals?${serializeWithdrawalsTableQuery(state)}`,
    { cache: "no-store" },
    "/admin/withdrawals",
  );

  if (!response.ok) throw new Error(await readApiError(response));

  const result = (await response.json()) as AdminWithdrawalsResponse;
  return {
    data: result.items,
    total: result.total,
    pageCount: result.pageCount,
  };
}

async function readApiError(response: Response) {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    return Array.isArray(body.message)
      ? body.message.join(", ")
      : body.message || `Request failed with ${response.status}`;
  } catch {
    return `Request failed with ${response.status}`;
  }
}
