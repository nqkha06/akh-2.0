import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

import type {
  AdminPageListItem,
  PageStatus,
} from "@/features/admin-pages/types";
import { getFiltersStateParser, getSortingStateParser } from "@/lib/parsers";

const statuses: PageStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

export const pagesSearchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<AdminPageListItem>().withDefault([
    { id: "updatedAt", desc: true },
  ]),
  search: parseAsString.withDefault(""),
  status: parseAsArrayOf(parseAsStringEnum(statuses)).withDefault([]),
  filters: getFiltersStateParser<AdminPageListItem>().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
});

export type AdminPagesTableQuery = Awaited<
  ReturnType<typeof pagesSearchParamsCache.parse>
>;
