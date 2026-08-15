/// <reference types="node" />

import "reflect-metadata";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BadRequestException } from "@nestjs/common";

import { QueryLinkReportsDto } from "../src/modules/link-reports/dto/admin-link-report.dto";
import { normalizeReportedUrl } from "../src/modules/link-reports/link-reports.normalizer";
import {
  assertLinkReportHasChanges,
  resolvedAtForStatus,
} from "../src/modules/link-reports/link-reports.policy";
import { buildLinkReportsListQuery } from "../src/modules/link-reports/queries/link-reports-list-query.builder";

function query(overrides: Partial<QueryLinkReportsDto> = {}) {
  return Object.assign(new QueryLinkReportsDto(), overrides);
}

describe("Link reports query and policy", () => {
  it("builds whitelisted filters, sorting and pagination", () => {
    const result = buildLinkReportsListQuery(
      query({
        page: 3,
        perPage: 10,
        search: "  RPT-2026  ",
        status: "pending",
        reason: "spam",
        sortBy: "email",
        sortOrder: "asc",
      }),
    );

    assert.deepEqual(result, {
      where: {
        deletedAt: null,
        status: "pending",
        reason: "spam",
        OR: [
          { reference: { contains: "RPT-2026" } },
          { email: { contains: "RPT-2026" } },
          { reportedUrl: { contains: "RPT-2026" } },
          { details: { contains: "RPT-2026" } },
        ],
      },
      orderBy: { email: "asc" },
      skip: 20,
      take: 10,
    });
  });

  it("normalizes HTTP URLs and rejects unsafe protocols", () => {
    assert.equal(
      normalizeReportedUrl("https://example.com/report?q=1"),
      "https://example.com/report?q=1",
    );
    assert.throws(
      () => normalizeReportedUrl("javascript:alert(1)"),
      BadRequestException,
    );
  });

  it("preserves patch and completion semantics", () => {
    assert.throws(() => assertLinkReportHasChanges({}), BadRequestException);
    assert.doesNotThrow(() =>
      assertLinkReportHasChanges({ resolutionNote: "Reviewed" }),
    );
    const now = new Date("2026-08-08T12:00:00.000Z");
    assert.equal(resolvedAtForStatus("resolved", now), now);
    assert.equal(resolvedAtForStatus("dismissed", now), now);
    assert.equal(resolvedAtForStatus("reviewing", now), null);
  });
});
