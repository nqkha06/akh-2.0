import { Prisma } from "@prisma/client";

import type { PageFilterDto } from "../dto/query-pages.dto";

type PageStringField = "title" | "slug" | "status";

export function buildPageListStringFilter(
  filter: PageFilterDto,
): Prisma.PageWhereInput | undefined {
  if (!isPageStringField(filter.id)) return undefined;
  const value =
    typeof filter.value === "string" ? filter.value : undefined;
  const values = Array.isArray(filter.value) ? filter.value : undefined;

  switch (filter.operator) {
    case "iLike":
      return value
        ? wrapPageStringFilter(filter.id, { contains: value })
        : undefined;
    case "notILike":
      return value
        ? { NOT: wrapPageStringFilter(filter.id, { contains: value }) }
        : undefined;
    case "eq":
      return value !== undefined
        ? wrapPageStringFilter(filter.id, { equals: value })
        : undefined;
    case "ne":
      return value !== undefined
        ? { NOT: wrapPageStringFilter(filter.id, { equals: value }) }
        : undefined;
    case "inArray":
      return values?.length
        ? wrapPageStringFilter(filter.id, { in: values })
        : undefined;
    case "notInArray":
      return values?.length
        ? wrapPageStringFilter(filter.id, { notIn: values })
        : undefined;
    case "isEmpty":
      return wrapPageStringFilter(filter.id, { equals: "" });
    case "isNotEmpty":
      return wrapPageStringFilter(filter.id, { not: "" });
    default:
      return undefined;
  }
}

function wrapPageStringFilter(
  field: PageStringField,
  condition: Prisma.StringFilter<"Page">,
): Prisma.PageWhereInput {
  switch (field) {
    case "title":
      return { title: condition };
    case "slug":
      return { slug: condition };
    case "status":
      return { status: condition };
  }
}

function isPageStringField(
  value: PageFilterDto["id"],
): value is PageStringField {
  return value === "title" || value === "slug" || value === "status";
}
