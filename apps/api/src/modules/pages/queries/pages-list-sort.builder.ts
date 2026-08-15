import { Prisma } from "@prisma/client";

import type { PageSortDto } from "../dto/query-pages.dto";

export const DEFAULT_PAGE_LIST_SORT = [
  { id: "updatedAt", desc: true },
] satisfies PageSortDto[];

export function buildPageListOrderBy(
  sort: PageSortDto,
): Prisma.PageOrderByWithRelationInput {
  const direction: Prisma.SortOrder = sort.desc ? "desc" : "asc";
  switch (sort.id) {
    case "title":
      return { title: direction };
    case "slug":
      return { slug: direction };
    case "status":
      return { status: direction };
    case "sortOrder":
      return { sortOrder: direction };
    case "createdAt":
      return { createdAt: direction };
    case "updatedAt":
      return { updatedAt: direction };
    case "publishedAt":
      return { publishedAt: direction };
  }
}
