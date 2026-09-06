import { Prisma } from "@prisma/client";

import type { ListSystemLogsQueryDto } from "../dto/list-system-logs-query.dto";

export function buildSystemLogsListQuery(query: ListSystemLogsQueryDto) {
  const conditions: Prisma.SystemLogWhereInput[] = [];
  const keyword = query.keyword?.trim();
  const user = query.user?.trim();
  const userId = user && /^\d+$/.test(user) ? Number(user) : null;

  if (keyword) {
    conditions.push({
      OR: [
        { message: { contains: keyword } },
        { context: { contains: keyword } },
        { event: { contains: keyword } },
        { requestId: { contains: keyword } },
        { category: { contains: keyword } },
      ],
    });
  }
  if (user) {
    conditions.push({
      OR: [
        ...(userId ? [{ userId }, { adminId: userId }] : []),
        {
          user: {
            is: {
              OR: [
                { name: { contains: user } },
                { email: { contains: user } },
              ],
            },
          },
        },
        {
          admin: {
            is: {
              OR: [
                { name: { contains: user } },
                { email: { contains: user } },
              ],
            },
          },
        },
      ],
    });
  }

  const where: Prisma.SystemLogWhereInput = {
    ...(query.level ? { level: query.level } : {}),
    ...(query.category
      ? { category: query.category.trim().toUpperCase() }
      : {}),
    ...(query.context?.trim()
      ? { context: { contains: query.context.trim() } }
      : {}),
    ...(query.event?.trim()
      ? { event: { contains: query.event.trim() } }
      : {}),
    ...(query.from || query.to
      ? {
          createdAt: {
            ...(query.from ? { gte: new Date(query.from) } : {}),
            ...(query.to ? { lte: new Date(query.to) } : {}),
          },
        }
      : {}),
    ...(conditions.length ? { AND: conditions } : {}),
  };

  return {
    where,
    orderBy: { createdAt: query.sortOrder } satisfies Prisma.SystemLogOrderByWithRelationInput,
    skip: (query.page - 1) * query.perPage,
    take: query.perPage,
  };
}
