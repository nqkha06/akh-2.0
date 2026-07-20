import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsStringEnum,
} from "nuqs/server";

import type {
  AdminMonetizationLevel,
  MonetizationLevelStatus,
} from "@/features/admin-monetization-levels/types";
import { getFiltersStateParser, getSortingStateParser } from "@/lib/parsers";

const statuses: MonetizationLevelStatus[] = [
  "draft",
  "pending",
  "published",
];

export const monetizationLevelsSearchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<AdminMonetizationLevel>().withDefault([
    { id: "sortOrder", desc: false },
  ]),
  status: parseAsArrayOf(parseAsStringEnum(statuses)).withDefault([]),
  filters: getFiltersStateParser<AdminMonetizationLevel>().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
});

export type MonetizationLevelsTableQuery = Awaited<
  ReturnType<typeof monetizationLevelsSearchParamsCache.parse>
>;
