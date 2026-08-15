/// <reference types="node" />

import "reflect-metadata";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BadRequestException, ConflictException } from "@nestjs/common";

import { ListMonetizationLevelsQueryDto } from "../src/modules/monetization-levels/dto/list-monetization-levels-query.dto";
import {
  assertMonetizationDefaultCanBeUnset,
  assertMonetizationDefaultPublished,
  assertMonetizationLevelCanDelete,
  assertUniqueMonetizationRates,
  assertUniqueMonetizationRoutes,
} from "../src/modules/monetization-levels/monetization-levels.policy";
import { buildMonetizationLevelsListQuery } from "../src/modules/monetization-levels/queries/monetization-levels-list-query.builder";

describe("Monetization levels query and policy", () => {
  it("builds type-safe search, status, pagination and multi-sort", () => {
    const query = Object.assign(new ListMonetizationLevelsQueryDto(), {
      page: 2,
      perPage: 5,
      search: "  starter  ",
      status: ["published" as const],
      sort: [
        { id: "status" as const, desc: false },
        { id: "updatedAt" as const, desc: true },
      ],
    });
    const result = buildMonetizationLevelsListQuery(query);

    assert.deepEqual(result.where, {
      status: { in: ["published"] },
      OR: [
        { key: { contains: "starter" } },
        { translations: { some: { name: { contains: "starter" } } } },
      ],
    });
    assert.deepEqual(result.orderBy, [
      { status: "asc" },
      { updatedAt: "desc" },
    ]);
    assert.equal(result.skip, 5);
    assert.equal(result.take, 5);
  });

  it("protects default and assigned levels", () => {
    assert.throws(
      () => assertMonetizationDefaultPublished(true, "draft"),
      BadRequestException,
    );
    assert.throws(
      () => assertMonetizationDefaultCanBeUnset(true, false),
      BadRequestException,
    );
    assert.throws(
      () =>
        assertMonetizationLevelCanDelete({
          isDefault: false,
          usersCount: 1,
        }),
      ConflictException,
    );
  });

  it("rejects ambiguous route and rate configurations", () => {
    const route = {
      id: "route",
      countryCode: "ALL",
      countryMode: "exclude" as const,
      deviceType: "any" as const,
      browserFamily: "any" as const,
      targetUrl: "https://example.com",
      priority: 1,
      weight: 1,
      enabled: true,
    };
    assert.throws(
      () => assertUniqueMonetizationRoutes([route]),
      BadRequestException,
    );
    const rate = {
      countryCode: "ALL",
      deviceType: "any" as const,
      baseCpm: "1",
      currency: "USD",
      enabled: true,
    };
    assert.throws(
      () => assertUniqueMonetizationRates([rate, rate]),
      BadRequestException,
    );
    assert.throws(
      () => assertUniqueMonetizationRates([{ ...rate, baseCpm: "0" }]),
      BadRequestException,
    );
  });
});
