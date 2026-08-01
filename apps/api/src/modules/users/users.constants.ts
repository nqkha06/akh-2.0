export const USER_STATUSES = [
  "active",
  "inactive",
  "locked",
  "suspended",
  "disabled",
] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

export const USER_SORTABLE_COLUMNS = [
  "id",
  "name",
  "email",
  "balance",
  "status",
  "createdAt",
  "updatedAt",
] as const;

export const USER_FILTERABLE_COLUMNS = [
  "id",
  "name",
  "email",
  "balance",
  "role",
  "status",
  "createdAt",
  "updatedAt",
] as const;

export const USER_FILTER_OPERATORS = [
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
