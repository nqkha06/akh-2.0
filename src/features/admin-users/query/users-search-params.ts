import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

import type { AdminUser } from "@/features/admin-users/types";
import { getFiltersStateParser, getSortingStateParser } from "@/lib/parsers";

const roles = ["admin", "member"] as const;
const statuses = [
  "active",
  "inactive",
  "locked",
  "suspended",
  "disabled",
] as const;

export const usersSearchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<AdminUser>().withDefault([
    { id: "createdAt", desc: true },
  ]),
  name: parseAsString.withDefault(""),
  email: parseAsString.withDefault(""),
  role: parseAsArrayOf(parseAsStringEnum([...roles])).withDefault([]),
  status: parseAsArrayOf(parseAsStringEnum([...statuses])).withDefault([]),
  filters: getFiltersStateParser<AdminUser>().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
});

export type UsersTableQuery = Awaited<
  ReturnType<typeof usersSearchParamsCache.parse>
>;
