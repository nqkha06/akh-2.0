/// <reference types="node" />

import "reflect-metadata";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NotFoundException } from "@nestjs/common";

import { ListSnippetsQueryDto } from "../src/modules/snippets/dto/list-snippets-query.dto";
import {
  buildSnippetCreateData,
  buildSnippetUpdateData,
  mapSnippetResponse,
} from "../src/modules/snippets/snippets.mapper";
import { parseSnippetId } from "../src/modules/snippets/snippets.policy";
import { buildSnippetsListQuery } from "../src/modules/snippets/queries/snippets-list-query.builder";

describe("Snippets query, mapper and policy", () => {
  it("scopes every query to the owner and whitelisted sort", () => {
    const query = Object.assign(new ListSnippetsQueryDto(), {
      page: 2,
      limit: 5,
      search: "  launch  ",
      sortBy: "name" as const,
      sortOrder: "asc" as const,
    });

    assert.deepEqual(buildSnippetsListQuery(42, query), {
      where: {
        userId: 42,
        deletedAt: null,
        OR: [
          { name: { contains: "launch" } },
          { content: { contains: "launch" } },
        ],
      },
      orderBy: { name: "asc" },
      skip: 5,
      take: 5,
    });
  });

  it("normalizes create/update data and keeps the response contract", () => {
    assert.deepEqual(
      buildSnippetCreateData({ content: "  destination  " }),
      { name: "destination", content: "destination" },
    );
    assert.deepEqual(
      buildSnippetUpdateData({ name: "  Saved  ", content: "  value  " }),
      { name: "Saved", content: "value" },
    );
    const createdAt = new Date("2026-08-08T00:00:00.000Z");
    const updatedAt = new Date("2026-08-08T01:00:00.000Z");
    assert.deepEqual(
      mapSnippetResponse({
        id: 7,
        name: "Saved",
        content: "value",
        createdAt,
        updatedAt,
      }),
      { id: "7", name: "Saved", content: "value", createdAt, updatedAt },
    );
  });

  it("maps invalid or unsafe identifiers to the existing not-found error", () => {
    assert.equal(parseSnippetId("12"), 12);
    for (const id of ["0", "-1", "1.2", "missing"]) {
      assert.throws(() => parseSnippetId(id), NotFoundException);
    }
  });
});
