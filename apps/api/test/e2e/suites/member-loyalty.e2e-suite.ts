import { LoyaltyRollupService } from "../../../src/modules/loyalty/loyalty-rollup.service";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  app,
  loginAs,
  prisma,
  request,
} from "../e2e-harness";

describe("Member loyalty E2E", () => {
  it("returns localized tiers, check/X states, and progress from earned visits", async () => {
    assert.equal((await request("/api/member/loyalty")).status, 401);

    const email = `loyalty-${process.pid}@example.com`;
    const password = "Secure123";
    assert.equal(
      (
        await request("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ name: "Loyalty Member", email, password }),
        })
      ).status,
      201,
    );
    const member = await loginAs(email, password);
    const authorization = {
      Authorization: `Bearer ${member.body.accessToken}`,
    };
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });

    for (const tier of [
      { key: "started", minimum: 0, order: 10, vi: "Khởi đầu", en: "Starter" },
      { key: "bronze", minimum: 2, order: 20, vi: "Đồng", en: "Bronze" },
      { key: "gold", minimum: 5, order: 30, vi: "Vàng", en: "Gold" },
    ]) {
      await prisma.loyaltyTier.create({
        data: {
          key: tier.key,
          minimumValidViews: tier.minimum,
          sortOrder: tier.order,
          iconKey: tier.key === "gold" ? "trophy" : "sparkles",
          status: "published",
          translations: {
            create: [
              {
                locale: "vi",
                name: tier.vi,
                benefitsJson: JSON.stringify([
                  {
                    key: "csv_export",
                    label: "Xuất báo cáo CSV",
                    included: tier.key === "gold",
                    value: null,
                  },
                ]),
              },
              {
                locale: "en",
                name: tier.en,
                benefitsJson: JSON.stringify([
                  {
                    key: "csv_export",
                    label: "CSV report export",
                    included: tier.key === "gold",
                    value: null,
                  },
                ]),
              },
            ],
          },
        },
      });
    }

    const link = await prisma.link.create({
      data: {
        userId: user.id,
        slug: `loyalty-${process.pid}`,
        title: "Loyalty source",
        destinationUrl: "https://example.com/loyalty",
      },
    });
    const agentHash = `loyalty-agent-${process.pid}`;
    await prisma.userAgent.create({
      data: {
        hash: agentHash,
        raw: "Loyalty E2E",
        browser: "test",
        os: "test",
        deviceType: 1,
      },
    });
    const now = new Date();
    await prisma.linkAccessLog.createMany({
      data: Array.from({ length: 4 }, (_, index) => ({
        id: `loyalty-access-${process.pid}-${index}`,
        linkId: link.id,
        userId: user.id,
        agentHash,
        ipAddress: `203.0.113.${index + 1}`,
        country: "VN",
        device: 1,
        payoutCpm: "1",
        revenue: index < 3 ? "0.001" : "0",
        isEarn: index < 3,
        completedAt: now,
        processedAt: now,
      })),
    });

    const response = await request("/api/member/loyalty?locale=en-US", {
      headers: authorization,
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      calculation: { windowDays: number; lastAggregatedAt: string | null };
      summary: {
        currentValue: number;
        currentTier: { key: string; name: string };
        nextTier: { key: string; name: string };
        nextTierTarget: number;
        remaining: number;
        progress: number;
      };
      tiers: Array<{
        key: string;
        name: string;
        isCurrent: boolean;
        isNext: boolean;
        benefits: Array<{ key: string; included: boolean }>;
      }>;
      history: Array<{
        dailyValidViews: number;
        rollingValidViews: number;
        tier: { key: string; name: string } | null;
      }>;
    };

    assert.equal(body.calculation.windowDays, 7);
    assert.ok(body.calculation.lastAggregatedAt);
    assert.equal(body.summary.currentValue, 3);
    assert.deepEqual(body.summary.currentTier, {
      key: "bronze",
      name: "Bronze",
    });
    assert.deepEqual(body.summary.nextTier, { key: "gold", name: "Gold" });
    assert.equal(body.summary.nextTierTarget, 5);
    assert.equal(body.summary.remaining, 2);
    assert.equal(body.summary.progress, 33);
    assert.equal(body.tiers.find((tier) => tier.key === "bronze")?.isCurrent, true);
    assert.equal(body.tiers.find((tier) => tier.key === "gold")?.isNext, true);
    assert.equal(
      body.tiers.find((tier) => tier.key === "bronze")?.benefits[0]
        ?.included,
      false,
    );
    assert.equal(
      body.tiers.find((tier) => tier.key === "gold")?.benefits[0]?.included,
      true,
    );
    assert.equal(body.history.length, 7);
    assert.equal(body.history[6]?.dailyValidViews, 3);
    assert.equal(body.history[6]?.rollingValidViews, 3);
    assert.equal(body.history[6]?.tier?.key, "bronze");

    const vietnamese = await request("/api/member/loyalty?locale=vi", {
      headers: authorization,
    });
    assert.equal(vietnamese.status, 200);
    assert.equal(
      ((await vietnamese.json()) as { summary: { currentTier: { name: string } } })
        .summary.currentTier.name,
      "Đồng",
    );

    assert.equal(
      (
        await request("/api/member/loyalty?locale=not_a_locale", {
          headers: authorization,
        })
      ).status,
      400,
    );
  });

  it("rolls up valid access logs at midnight and persists the member tier idempotently", async () => {
    const email = `loyalty-rollup-${process.pid}@example.com`;
    const password = "Secure123";
    assert.equal(
      (
        await request("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ name: "Rollup Member", email, password }),
        })
      ).status,
      201,
    );
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const link = await prisma.link.create({
      data: {
        userId: user.id,
        slug: `loyalty-rollup-${process.pid}`,
        title: "Loyalty rollup source",
        destinationUrl: "https://example.com/loyalty-rollup",
      },
    });
    const agentHash = `loyalty-rollup-agent-${process.pid}`;
    await prisma.userAgent.create({
      data: {
        hash: agentHash,
        raw: "Loyalty Rollup E2E",
        browser: "test",
        os: "test",
        deviceType: 1,
      },
    });

    const firstRunAt = new Date("2035-06-10T00:00:00.000Z");
    const completedAt = new Date("2035-06-09T12:00:00.000Z");
    await prisma.linkAccessLog.createMany({
      data: Array.from({ length: 5 }, (_, index) => ({
        id: `loyalty-rollup-access-${process.pid}-${index}`,
        linkId: link.id,
        userId: user.id,
        agentHash,
        ipAddress: `198.51.100.${index + 1}`,
        country: "VN",
        device: 1,
        payoutCpm: "1",
        revenue: "0.001",
        isEarn: true,
        completedAt,
        processedAt: completedAt,
      })),
    });

    const rollup = app.get(LoyaltyRollupService);
    const first = await rollup.run(firstRunAt);
    assert.equal(first.skipped, false);
    assert.equal(first.dayKey, "2035-06-10");
    assert.equal(first.totalValidViews, 5);

    const promoted = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { loyaltyTier: true },
    });
    assert.equal(promoted.loyaltyValidViews, 5);
    assert.equal(promoted.loyaltyTier?.key, "gold");
    assert.equal(
      promoted.loyaltyWindowEndedAt?.toISOString(),
      "2035-06-10T00:00:00.000Z",
    );

    const duplicate = await rollup.run(firstRunAt);
    assert.equal(duplicate.skipped, true);
    assert.equal(
      await prisma.loyaltyRollupRun.count({
        where: { dayKey: "2035-06-10" },
      }),
      1,
    );

    const expired = await rollup.run(new Date("2035-06-18T00:00:00.000Z"));
    assert.equal(expired.skipped, false);
    const downgraded = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { loyaltyTier: true },
    });
    assert.equal(downgraded.loyaltyValidViews, 0);
    assert.equal(downgraded.loyaltyTier?.key, "started");

    await prisma.link.delete({ where: { id: link.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.userAgent.delete({ where: { hash: agentHash } });
  });
});

