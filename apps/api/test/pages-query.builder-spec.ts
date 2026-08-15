/// <reference types="node" />

import "reflect-metadata";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  PageFilterDto,
  PageSortDto,
  QueryPagesDto,
} from "../src/modules/pages/dto/query-pages.dto";
import { buildPagesListQuery } from "../src/modules/pages/queries/pages-list-query.builder";

function query(overrides: Partial<QueryPagesDto> = {}) {
  return Object.assign(new QueryPagesDto(), overrides);
}

function sort(id: PageSortDto["id"], desc: boolean) {
  return Object.assign(new PageSortDto(), { id, desc });
}

function filter(
  id: PageFilterDto["id"],
  operator: PageFilterDto["operator"],
  value: PageFilterDto["value"],
) {
  return Object.assign(new PageFilterDto(), {
    id,
    operator,
    value,
    variant: "text" as const,
    filterId: `${id}-${operator}`,
  });
}

describe("Pages query builder", () => {
  it("builds the default sort, pagination and standard filters", () => {
    const result = buildPagesListQuery(
      query({
        page: 2,
        perPage: 5,
        search: "  policy  ",
        status: ["DRAFT"],
      }),
    );

    assert.deepEqual(result.where, {
      deletedAt: null,
      status: { in: ["DRAFT"] },
      OR: [
        { title: { contains: "policy" } },
        { slug: { contains: "policy" } },
      ],
    });
    assert.deepEqual(result.orderBy, [{ updatedAt: "desc" }]);
    assert.deepEqual(result.appliedSort, [{ id: "updatedAt", desc: true }]);
    assert.equal(result.skip, 5);
    assert.equal(result.take, 5);
  });

  it("combines whitelisted string filters with the requested join operator", () => {
    const result = buildPagesListQuery(
      query({
        joinOperator: "or",
        filters: [
          filter("title", "iLike", "privacy"),
          filter("status", "inArray", ["DRAFT", "PUBLISHED"]),
          filter("slug", "notILike", "legacy"),
        ],
      }),
    );

    assert.deepEqual(result.where, {
      AND: [
        { deletedAt: null },
        {
          OR: [
            { title: { contains: "privacy" } },
            { status: { in: ["DRAFT", "PUBLISHED"] } },
            { NOT: { slug: { contains: "legacy" } } },
          ],
        },
      ],
    });
  });

  it("uses local day boundaries for date equality and nullable filters", () => {
    const date = new Date("2026-08-08T12:00:00");
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const result = buildPagesListQuery(
      query({
        filters: [
          filter("createdAt", "eq", "2026-08-08T12:00:00"),
          filter("publishedAt", "isEmpty", ""),
        ],
      }),
    );

    assert.deepEqual(result.where, {
      AND: [
        { deletedAt: null },
        {
          AND: [
            { createdAt: { gte: start, lte: end } },
            { publishedAt: null },
          ],
        },
      ],
    });
  });

  it("builds deterministic relative ranges and explicit sort fields", () => {
    const now = new Date("2026-08-08T12:30:00");
    const start = new Date("2026-08-15T00:00:00");
    const end = new Date("2026-08-21T23:59:59.999");
    const result = buildPagesListQuery(
      query({
        sort: [sort("title", false), sort("publishedAt", true)],
        filters: [filter("updatedAt", "isRelativeToToday", "1 weeks")],
      }),
      now,
    );

    assert.deepEqual(result.orderBy, [
      { title: "asc" },
      { publishedAt: "desc" },
    ]);
    assert.deepEqual(result.where, {
      AND: [
        { deletedAt: null },
        {
          AND: [{ updatedAt: { gte: start, lte: end } }],
        },
      ],
    });
  });

  it("represents empty filters on non-null dates without unsafe Prisma input", () => {
    const empty = buildPagesListQuery(
      query({ filters: [filter("createdAt", "isEmpty", "")] }),
    );
    const notEmpty = buildPagesListQuery(
      query({ filters: [filter("createdAt", "isNotEmpty", "")] }),
    );

    assert.deepEqual(empty.where, {
      AND: [{ deletedAt: null }, { AND: [{ id: { in: [] } }] }],
    });
    assert.deepEqual(notEmpty.where, {
      AND: [{ deletedAt: null }, { AND: [{}] }],
    });
  });
});
