import { Prisma } from "@prisma/client";

import type { PageFilterDto, QueryPagesDto } from "../dto/query-pages.dto";
import { buildPageListDateFilter } from "./pages-list-date-filter.builder";
import { buildPageListStringFilter } from "./pages-list-string-filter.builder";

export function buildStandardPageListWhere(
  query: QueryPagesDto,
): Prisma.PageWhereInput {
  const search = query.search?.trim();
  return {
    deletedAt: null,
    ...(query.status?.length ? { status: { in: query.status } } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search } },
            { slug: { contains: search } },
          ],
        }
      : {}),
  };
}

export function buildAdvancedPageListWhere(
  filters: PageFilterDto[],
  joinOperator: "and" | "or",
  now: Date,
): Prisma.PageWhereInput | undefined {
  const conditions = filters
    .map((filter) => buildFilterCondition(filter, now))
    .filter(
      (condition): condition is Prisma.PageWhereInput => condition !== undefined,
    );
  if (!conditions.length) return undefined;
  return joinOperator === "or" ? { OR: conditions } : { AND: conditions };
}

function buildFilterCondition(
  filter: PageFilterDto,
  now: Date,
): Prisma.PageWhereInput | undefined {
  return isPageDateField(filter.id)
    ? buildPageListDateFilter(filter.id, filter, now)
    : buildPageListStringFilter(filter);
}

function isPageDateField(
  value: PageFilterDto["id"],
): value is "createdAt" | "updatedAt" | "publishedAt" {
  return (
    value === "createdAt" ||
    value === "updatedAt" ||
    value === "publishedAt"
  );
}
