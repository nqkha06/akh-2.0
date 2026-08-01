import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"

import type {
  AdminSocialLink,
  AdminSocialLinkDeletionState,
  AdminSocialLinkDestinationType,
  AdminSocialLinkStatus,
} from "@/features/admin-social-links/types"
import { getFiltersStateParser, getSortingStateParser } from "@/lib/parsers"

const statuses: AdminSocialLinkStatus[] = ["active", "inactive", "paused"]
const destinationTypes: AdminSocialLinkDestinationType[] = [
  "url",
  "file",
  "snippet",
]
const deletionStates: AdminSocialLinkDeletionState[] = ["active", "deleted"]

export const socialLinksSearchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<AdminSocialLink>().withDefault([
    { id: "createdAt", desc: true },
  ]),
  title: parseAsString.withDefault(""),
  owner: parseAsString.withDefault(""),
  userId: parseAsInteger,
  status: parseAsArrayOf(parseAsStringEnum(statuses)).withDefault([]),
  destinationType: parseAsArrayOf(
    parseAsStringEnum(destinationTypes),
  ).withDefault([]),
  deletedState: parseAsArrayOf(
    parseAsStringEnum(deletionStates),
  ).withDefault(["active"]),
  filters: getFiltersStateParser<AdminSocialLink>().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
})

export type AdminSocialLinksTableQuery = Awaited<
  ReturnType<typeof socialLinksSearchParamsCache.parse>
>
