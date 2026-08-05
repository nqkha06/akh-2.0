/// <reference types="node" />

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  evaluateAccessFraudRules,
  type AccessAnalysisContext,
} from "../src/modules/stu-access-logs/rules/access-fraud.rules";

function context(
  overrides: Partial<AccessAnalysisContext> = {},
): AccessAnalysisContext {
  return {
    totalRequests: 100,
    totalRevenue: 100,
    previousPeriodRequests: 100,
    velocity: [],
    topIps: [],
    sharedAgent: null,
    countries: {
      validCountryCount24h: 1,
      maxCountriesInHour: 1,
      shortestChangeMinutes: null,
      values: ["VN"],
    },
    ...overrides,
  };
}

describe("Access fraud rules", () => {
  it("scores only the highest IP velocity threshold in its category", () => {
    const result = evaluateAccessFraudRules(
      context({
        velocity: [
          { ipAddress: "203.0.113.10", requestCount: 47, windowSeconds: 60 },
          { ipAddress: "203.0.113.10", requestCount: 140, windowSeconds: 300 },
          { ipAddress: "203.0.113.10", requestCount: 700, windowSeconds: 3600 },
        ],
      }),
    );
    const reasons = result.reasons.filter(
      (reason) => reason.code === "IP_HIGH_VELOCITY",
    );
    assert.equal(reasons.length, 1);
    assert.equal(reasons[0]?.score, 25);
  });

  it("scores revenue concentration using earned requests only", () => {
    const result = evaluateAccessFraudRules(
      context({
        totalRevenue: 320,
        topIps: [
          {
            ipAddress: "203.0.113.10",
            requestCount: 120,
            earnedRequestCount: 94,
            revenue: 280,
            distinctUserCount: 1,
          },
        ],
      }),
    );
    assert.equal(
      result.reasons.find(
        (reason) => reason.code === "IP_REVENUE_CONCENTRATION",
      )?.score,
      25,
    );
  });

  it("detects rapid country changes and traffic spikes", () => {
    const result = evaluateAccessFraudRules(
      context({
        totalRequests: 420,
        previousPeriodRequests: 100,
        countries: {
          validCountryCount24h: 3,
          maxCountriesInHour: 3,
          shortestChangeMinutes: 8,
          values: ["VN", "US", "DE"],
        },
      }),
    );
    assert.equal(
      result.reasons.some((reason) => reason.code === "RAPID_COUNTRY_CHANGE"),
      true,
    );
    assert.equal(
      result.reasons.find((reason) => reason.code === "TRAFFIC_SPIKE")?.score,
      20,
    );
  });

  it("caps total risk at 100 and never adds duplicate categories", () => {
    const result = evaluateAccessFraudRules(
      context({
        totalRequests: 1_000,
        totalRevenue: 100,
        previousPeriodRequests: 100,
        velocity: [
          { ipAddress: "203.0.113.10", requestCount: 200, windowSeconds: 60 },
        ],
        topIps: [
          {
            ipAddress: "203.0.113.10",
            requestCount: 900,
            earnedRequestCount: 100,
            revenue: 95,
            distinctUserCount: 12,
          },
        ],
        sharedAgent: {
          agentHash: "abc",
          distinctUserCount: 12,
          requestCount: 900,
        },
        countries: {
          validCountryCount24h: 3,
          maxCountriesInHour: 3,
          shortestChangeMinutes: 5,
          values: ["VN", "US", "DE"],
        },
      }),
    );
    assert.equal(result.score, 100);
    assert.equal(
      new Set(result.reasons.map((reason) => reason.category)).size,
      result.reasons.length,
    );
  });
});
