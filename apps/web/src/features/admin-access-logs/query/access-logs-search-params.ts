import {
  createSearchParamsCache,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

export const accessLogsSearchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  from: parseAsString,
  to: parseAsString,
  userId: parseAsInteger,
  user: parseAsString.withDefault(""),
  linkId: parseAsInteger,
  link: parseAsString.withDefault(""),
  ip: parseAsString.withDefault(""),
  country: parseAsString.withDefault(""),
  device: parseAsInteger,
  isEarn: parseAsBoolean,
  hasRevenue: parseAsBoolean,
  detectionMask: parseAsInteger,
  rejectReasonMask: parseAsInteger,
  state: parseAsStringEnum(["normal", "rejected", "suspicious"]),
  reviewStatus: parseAsStringEnum([
    "unreviewed",
    "safe",
    "suspicious",
    "follow_up",
  ]),
  sortBy: parseAsStringEnum(["createdAt", "revenue"]).withDefault("createdAt"),
  sortOrder: parseAsStringEnum(["asc", "desc"]).withDefault("desc"),
});

export type AccessLogsTableQuery = Awaited<
  ReturnType<typeof accessLogsSearchParamsCache.parse>
>;
