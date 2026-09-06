import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

export const systemLogsSearchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  level: parseAsStringEnum(["info", "warn", "error", "debug"]),
  category: parseAsString.withDefault(""),
  context: parseAsString.withDefault(""),
  event: parseAsString.withDefault(""),
  user: parseAsString.withDefault(""),
  keyword: parseAsString.withDefault(""),
  from: parseAsString,
  to: parseAsString,
});

export type SystemLogsQuery = Awaited<
  ReturnType<typeof systemLogsSearchParamsCache.parse>
>;
