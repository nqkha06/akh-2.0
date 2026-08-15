import { Prisma } from "@prisma/client";

import type { PageSortDto, QueryPagesDto } from "../dto/query-pages.dto";
import {
  buildAdvancedPageListWhere,
  buildStandardPageListWhere,
} from "./pages-list-filter.builder";
import {
  buildPageListOrderBy,
  DEFAULT_PAGE_LIST_SORT,
} from "./pages-list-sort.builder";

export function buildPagesListQuery(query: QueryPagesDto, now = new Date()) {
  const appliedSort = query.sort?.length ? query.sort : DEFAULT_PAGE_LIST_SORT;
  const standardWhere = buildStandardPageListWhere(query);
  const advancedWhere = buildAdvancedPageListWhere(
    query.filters ?? [],
    query.joinOperator,
    now,
  );

  return {
    where: advancedWhere
      ? { AND: [standardWhere, advancedWhere] }
      : standardWhere,
    orderBy: appliedSort.map(buildPageListOrderBy),
    skip: (query.page - 1) * query.perPage,
    take: query.perPage,
    appliedSort,
  } satisfies {
    where: Prisma.PageWhereInput;
    orderBy: Prisma.PageOrderByWithRelationInput[];
    skip: number;
    take: number;
    appliedSort: PageSortDto[];
  };
}
