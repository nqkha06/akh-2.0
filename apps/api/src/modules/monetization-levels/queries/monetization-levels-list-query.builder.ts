import { Prisma } from "@prisma/client";

import type {
  ListMonetizationLevelsQueryDto,
  MonetizationLevelSortDto,
} from "../dto/list-monetization-levels-query.dto";

export function buildMonetizationLevelsListQuery(
  query: ListMonetizationLevelsQueryDto,
) {
  const search = (query.name || query.search)?.trim();
  const appliedSort = query.sort?.length
    ? query.sort
    : [{ id: query.sortBy, desc: query.sortOrder === "desc" }];
  return {
    where: {
      ...(query.status?.length ? { status: { in: query.status } } : {}),
      ...(search
        ? {
            OR: [
              { key: { contains: search } },
              { translations: { some: { name: { contains: search } } } },
            ],
          }
        : {}),
    },
    orderBy: appliedSort.map(buildMonetizationLevelOrderBy),
    skip: (query.page - 1) * query.perPage,
    take: query.perPage,
    appliedSort,
    search: search || null,
  } satisfies {
    where: Prisma.MonetizationLevelWhereInput;
    orderBy: Prisma.MonetizationLevelOrderByWithRelationInput[];
    skip: number;
    take: number;
    appliedSort: MonetizationLevelSortDto[];
    search: string | null;
  };
}

function buildMonetizationLevelOrderBy(
  sort: MonetizationLevelSortDto,
): Prisma.MonetizationLevelOrderByWithRelationInput {
  const direction: Prisma.SortOrder = sort.desc ? "desc" : "asc";
  switch (sort.id) {
    case "key":
      return { key: direction };
    case "status":
      return { status: direction };
    case "isDefault":
      return { isDefault: direction };
    case "sortOrder":
      return { sortOrder: direction };
    case "createdAt":
      return { createdAt: direction };
    case "updatedAt":
      return { updatedAt: direction };
  }
}
