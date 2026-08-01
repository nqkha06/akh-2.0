import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

import {
  type AdminUserListItem,
  userStatuses,
} from "@/features/admin-users/types";
import { getFiltersStateParser, getSortingStateParser } from "@/lib/parsers";

export const usersSearchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<AdminUserListItem>().withDefault([
    { id: "createdAt", desc: true },
  ]),
  name: parseAsString.withDefault(""),
  email: parseAsString.withDefault(""),
  role: parseAsArrayOf(parseAsString).withDefault([]),
  status: parseAsArrayOf(parseAsStringEnum([...userStatuses])).withDefault([]),
  filters: getFiltersStateParser<AdminUserListItem>().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
});

export type UsersTableQuery = Awaited<
  ReturnType<typeof usersSearchParamsCache.parse>
>;
