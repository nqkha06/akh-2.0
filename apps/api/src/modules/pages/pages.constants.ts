export const PAGE_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type PageStatus = (typeof PAGE_STATUSES)[number];

export const PAGE_SORTABLE_COLUMNS = [
  "title",
  "slug",
  "status",
  "sortOrder",
  "createdAt",
  "updatedAt",
  "publishedAt",
] as const;

export const PAGE_FILTERABLE_COLUMNS = [
  "title",
  "slug",
  "status",
  "createdAt",
  "updatedAt",
  "publishedAt",
] as const;

export const PAGE_FILTER_VARIANTS = [
  "text",
  "number",
  "range",
  "date",
  "dateRange",
  "boolean",
  "select",
  "multiSelect",
] as const;

export const PAGE_FILTER_OPERATORS = [
  "iLike",
  "notILike",
  "eq",
  "ne",
  "inArray",
  "notInArray",
  "isEmpty",
  "isNotEmpty",
  "lt",
  "lte",
  "gt",
  "gte",
  "isBetween",
  "isRelativeToToday",
] as const;
