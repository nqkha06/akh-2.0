import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsStringEnum,
} from "nuqs/server";

import type { AdminLoyaltyTier } from "@/features/admin-loyalty-tiers/types";
import { getFiltersStateParser, getSortingStateParser } from "@/lib/parsers";
import type { PublicationStatus } from "@/types/publication-status";

const statuses: PublicationStatus[] = ["draft", "pending", "published"];

export const loyaltyTiersSearchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<AdminLoyaltyTier>().withDefault([
    { id: "sortOrder", desc: false },
  ]),
  status: parseAsArrayOf(parseAsStringEnum(statuses)).withDefault([]),
  filters: getFiltersStateParser<AdminLoyaltyTier>().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
});

export type LoyaltyTiersTableQuery = Awaited<
  ReturnType<typeof loyaltyTiersSearchParamsCache.parse>
>;
