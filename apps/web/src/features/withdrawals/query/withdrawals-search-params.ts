import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

import type {
  AdminWithdrawal,
  WithdrawalStatus,
} from "@/features/withdrawals/types";
import { getSortingStateParser } from "@/lib/parsers";

const statuses: WithdrawalStatus[] = [
  "pending",
  "processing",
  "paid",
  "rejected",
  "cancelled",
];

export const withdrawalsSearchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<AdminWithdrawal>().withDefault([
    { id: "createdAt", desc: true },
  ]),
  member: parseAsString.withDefault(""),
  userId: parseAsInteger,
  status: parseAsArrayOf(parseAsStringEnum(statuses)).withDefault([]),
});

export type WithdrawalsTableQuery = Awaited<
  ReturnType<typeof withdrawalsSearchParamsCache.parse>
>;
