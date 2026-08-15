import { Prisma } from "@prisma/client";

export const MONETIZATION_LEVEL_INCLUDE = {
  translations: { orderBy: { locale: "asc" } },
  _count: { select: { users: true } },
} satisfies Prisma.MonetizationLevelInclude;

export const MONETIZATION_LEVEL_SUMMARY_SELECT = {
  status: true,
  routesJson: true,
  ratesJson: true,
  _count: { select: { users: true } },
} satisfies Prisma.MonetizationLevelSelect;

export type MonetizationLevelRecord = Prisma.MonetizationLevelGetPayload<{
  include: typeof MONETIZATION_LEVEL_INCLUDE;
}>;

export type MonetizationLevelSummaryRecord =
  Prisma.MonetizationLevelGetPayload<{
    select: typeof MONETIZATION_LEVEL_SUMMARY_SELECT;
  }>;
