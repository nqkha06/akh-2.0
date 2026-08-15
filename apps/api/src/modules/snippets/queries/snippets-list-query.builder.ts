import { Prisma } from "@prisma/client";

import type { ListSnippetsQueryDto } from "../dto/list-snippets-query.dto";

export function buildSnippetsListQuery(
  userId: number,
  query: ListSnippetsQueryDto,
) {
  const search = query.search?.trim();
  return {
    where: {
      userId,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { content: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: buildSnippetOrderBy(query.sortBy, query.sortOrder),
    skip: (query.page - 1) * query.limit,
    take: query.limit,
  } satisfies {
    where: Prisma.SnippetWhereInput;
    orderBy: Prisma.SnippetOrderByWithRelationInput;
    skip: number;
    take: number;
  };
}

function buildSnippetOrderBy(
  field: ListSnippetsQueryDto["sortBy"],
  direction: Prisma.SortOrder,
): Prisma.SnippetOrderByWithRelationInput {
  switch (field) {
    case "name":
      return { name: direction };
    case "createdAt":
      return { createdAt: direction };
    case "updatedAt":
      return { updatedAt: direction };
  }
}
