import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  login,
  request,
} from "../e2e-harness";

describe("Member dashboard E2E", () => {
  it("requires authentication and returns a simple real-data overview", async () => {
    assert.equal((await request("/api/member/dashboard")).status, 401);

    const member = await login();
    const response = await request("/api/member/dashboard", {
      headers: { Authorization: `Bearer ${member.body.accessToken}` },
    });
    assert.equal(response.status, 200);

    const body = (await response.json()) as {
      member: { name: string; balance: string };
      analytics: {
        periodDays: number;
        metrics: {
          revenue: number;
          successfulOpens: number;
          earnedViews: number;
          averageCpm: number;
        };
        changes: {
          revenue: number | null;
          successfulOpens: number | null;
          earnedViews: number | null;
          averageCpm: number | null;
        };
        today: {
          revenue: number;
          successfulOpens: number;
          earnedViews: number;
          averageCpm: number;
        };
        series: unknown[];
        breakdowns: {
          countries: unknown[];
          devices: unknown[];
          browsers: unknown[];
        };
        topLinks: unknown[];
      };
    };
    assert.equal(body.member.name, "Auth Test");
    assert.equal(body.member.balance, "0");
    assert.equal(body.analytics.periodDays, 30);
    assert.equal(typeof body.analytics.metrics.successfulOpens, "number");
    assert.equal(typeof body.analytics.metrics.revenue, "number");
    assert.ok(
      body.analytics.changes.successfulOpens === null ||
        typeof body.analytics.changes.successfulOpens === "number",
    );
    assert.ok(
      body.analytics.changes.revenue === null ||
        typeof body.analytics.changes.revenue === "number",
    );
    assert.equal(typeof body.analytics.today.successfulOpens, "number");
    assert.equal(body.analytics.series.length, 30);
    assert.ok(Array.isArray(body.analytics.breakdowns.countries));
    assert.ok(Array.isArray(body.analytics.breakdowns.devices));
    assert.ok(Array.isArray(body.analytics.breakdowns.browsers));
    assert.ok(Array.isArray(body.analytics.topLinks));

    for (const [range, days] of [
      ["today", 1],
      ["yesterday", 1],
      ["7d", 7],
      ["30d", 30],
      ["60d", 60],
      ["90d", 90],
    ] as const) {
      const rangeResponse = await request(
        `/api/member/dashboard?range=${range}`,
        {
          headers: { Authorization: `Bearer ${member.body.accessToken}` },
        },
      );
      assert.equal(rangeResponse.status, 200);
      const rangeBody = (await rangeResponse.json()) as {
        analytics: { periodDays: number; series: unknown[] };
      };
      assert.equal(rangeBody.analytics.periodDays, days);
      assert.equal(rangeBody.analytics.series.length, days);
    }

    assert.equal(
      (
        await request("/api/member/dashboard?range=invalid", {
          headers: { Authorization: `Bearer ${member.body.accessToken}` },
        })
      ).status,
      400,
    );
  });
});
