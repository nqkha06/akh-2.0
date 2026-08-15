import { Prisma } from "@prisma/client";

import type { QueryLinkReportsDto } from "../dto/admin-link-report.dto";

export function buildLinkReportsListQuery(query: QueryLinkReportsDto) {
  const search = query.search?.trim();
  return {
    where: {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.reason ? { reason: query.reason } : {}),
      ...(search
        ? {
            OR: [
              { reference: { contains: search } },
              { email: { contains: search } },
              { reportedUrl: { contains: search } },
              { details: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: buildLinkReportOrderBy(query.sortBy, query.sortOrder),
    skip: (query.page - 1) * query.perPage,
    take: query.perPage,
  } satisfies {
    where: Prisma.LinkReportWhereInput;
    orderBy: Prisma.LinkReportOrderByWithRelationInput;
    skip: number;
    take: number;
  };
}

function buildLinkReportOrderBy(
  field: QueryLinkReportsDto["sortBy"],
  direction: Prisma.SortOrder,
): Prisma.LinkReportOrderByWithRelationInput {
  switch (field) {
    case "createdAt":
      return { createdAt: direction };
    case "updatedAt":
      return { updatedAt: direction };
    case "status":
      return { status: direction };
    case "email":
      return { email: direction };
  }
}
