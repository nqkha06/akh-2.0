import { Prisma } from "@prisma/client";

import type { PageFilterDto } from "../dto/query-pages.dto";

type PageDateField = "createdAt" | "updatedAt" | "publishedAt";

export function buildPageListDateFilter(
  field: PageDateField,
  filter: PageFilterDto,
  now: Date,
): Prisma.PageWhereInput | undefined {
  const value =
    typeof filter.value === "string" ? filter.value : undefined;
  const values = Array.isArray(filter.value) ? filter.value : undefined;
  const date = value ? parseDate(value) : null;

  if (filter.operator === "isEmpty") {
    return field === "publishedAt" ? { publishedAt: null } : noPageMatches();
  }
  if (filter.operator === "isNotEmpty") {
    return field === "publishedAt" ? { publishedAt: { not: null } } : {};
  }

  switch (filter.operator) {
    case "eq":
      return date
        ? wrapPageDateFilter(field, {
            gte: startOfDay(date),
            lte: endOfDay(date),
          })
        : undefined;
    case "ne":
      return date
        ? {
            OR: [
              wrapPageDateFilter(field, { lt: startOfDay(date) }),
              wrapPageDateFilter(field, { gt: endOfDay(date) }),
            ],
          }
        : undefined;
    case "lt":
      return date
        ? wrapPageDateFilter(field, { lt: endOfDay(date) })
        : undefined;
    case "lte":
      return date
        ? wrapPageDateFilter(field, { lte: endOfDay(date) })
        : undefined;
    case "gt":
      return date
        ? wrapPageDateFilter(field, { gt: startOfDay(date) })
        : undefined;
    case "gte":
      return date
        ? wrapPageDateFilter(field, { gte: startOfDay(date) })
        : undefined;
    case "isBetween":
      return buildBetweenDateFilter(field, values);
    case "isRelativeToToday":
      return value ? buildRelativeDateFilter(field, value, now) : undefined;
    default:
      return undefined;
  }
}

function buildBetweenDateFilter(
  field: PageDateField,
  values: string[] | undefined,
) {
  if (!values || values.length !== 2) return undefined;
  const start = values[0] ? parseDate(values[0]) : null;
  const end = values[1] ? parseDate(values[1]) : null;
  if (!start && !end) return undefined;
  return wrapPageDateFilter(field, {
    ...(start ? { gte: startOfDay(start) } : {}),
    ...(end ? { lte: endOfDay(end) } : {}),
  });
}

function buildRelativeDateFilter(
  field: PageDateField,
  value: string,
  now: Date,
) {
  const [amountValue, unit] = value.split(" ");
  const amount = Number.parseInt(amountValue || "", 10);
  if (!Number.isFinite(amount)) return undefined;
  const days = relativeDays(amount, unit);
  if (days === null) return undefined;

  const start = new Date(now);
  start.setDate(start.getDate() + days);
  const end = new Date(start);
  end.setDate(
    end.getDate() + (unit === "weeks" ? 6 : unit === "months" ? 29 : 0),
  );
  return wrapPageDateFilter(field, {
    gte: startOfDay(start),
    lte: endOfDay(end),
  });
}

function relativeDays(amount: number, unit: string | undefined) {
  if (unit === "days") return amount;
  if (unit === "weeks") return amount * 7;
  if (unit === "months") return amount * 30;
  return null;
}

function wrapPageDateFilter(
  field: PageDateField,
  condition: Prisma.DateTimeFilter<"Page">,
): Prisma.PageWhereInput {
  switch (field) {
    case "createdAt":
      return { createdAt: condition };
    case "updatedAt":
      return { updatedAt: condition };
    case "publishedAt":
      return { publishedAt: condition };
  }
}

function noPageMatches(): Prisma.PageWhereInput {
  return { id: { in: [] } };
}

function parseDate(value: string) {
  const numeric = Number(value);
  const date = new Date(Number.isFinite(numeric) ? numeric : value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}
