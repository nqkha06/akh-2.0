import { LinkAccessAggregationWorker } from "../../../src/modules/links/link-access-aggregation.worker";
import { resolveMonetizationRoute } from "../../../src/modules/links/monetization-route-resolver";
import type { MonetizationRouteDto } from "../../../src/modules/monetization-levels/dto/monetization-level-config.dto";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  adminAccessToken,
  app,
  prisma,
  request,
} from "../e2e-harness";

describe("Public monetization route resolution E2E", () => {
  it("uses deterministic weighted selection within the highest priority", () => {
    const routes: MonetizationRouteDto[] = [
      {
        id: "light",
        countryCode: "ALL",
        countryMode: "include",
        deviceType: "any",
        deviceMode: "include",
        browserFamily: "any",
        browserMode: "include",
        targetUrl: "https://example.com/light",
        priority: 20,
        weight: 10,
        enabled: true,
      },
      {
        id: "heavy",
        countryCode: "ALL",
        countryMode: "include",
        deviceType: "any",
        deviceMode: "include",
        browserFamily: "any",
        browserMode: "include",
        targetUrl: "https://example.com/heavy",
        priority: 20,
        weight: 90,
        enabled: true,
      },
    ];
    const counts = { light: 0, heavy: 0 };

    for (let index = 0; index < 500; index += 1) {
      const resolved = resolveMonetizationRoute(routes, {
        countryCode: "VN",
        deviceType: "mobile",
        browserFamily: "chrome",
        visitorKey: `visitor-${index}`,
      });
      assert.ok(resolved);
      counts[resolved.id as keyof typeof counts] += 1;
    }

    assert.ok(counts.heavy > counts.light * 4);
    assert.equal(
      resolveMonetizationRoute(routes, {
        countryCode: "VN",
        deviceType: "mobile",
        browserFamily: "chrome",
        visitorKey: "same-visitor",
      })?.id,
      resolveMonetizationRoute(routes, {
        countryCode: "VN",
        deviceType: "mobile",
        browserFamily: "chrome",
        visitorKey: "same-visitor",
      })?.id,
    );
  });

  it("returns only available public links from the same owner as related links", async () => {
    const owner = await prisma.user.create({
      data: {
        name: "Related Links Owner",
        email: "related-links-owner@example.com",
      },
    });
    const otherOwner = await prisma.user.create({
      data: {
        name: "Other Related Links Owner",
        email: "other-related-links-owner@example.com",
      },
    });
    const current = await prisma.link.create({
      data: {
        userId: owner.id,
        slug: "related-links-current",
        title: "Current link",
        destinationUrl: "https://example.com/current",
      },
    });
    await prisma.link.createMany({
      data: [
        {
          userId: owner.id,
          slug: "related-links-visible",
          title: "Visible related link",
          subtitle: "From the same creator",
          destinationType: "file",
          destinationUrl: "https://example.com/visible",
          appearanceJson: JSON.stringify({
            coverImageUrl: "https://images.example.com/related.jpg",
          }),
          views: 12,
        },
        {
          userId: owner.id,
          slug: "related-links-expired",
          title: "Expired related link",
          destinationUrl: "https://example.com/expired",
          expiresAt: new Date(Date.now() - 60_000),
          views: 99,
        },
        {
          userId: owner.id,
          slug: "related-links-paused",
          title: "Paused related link",
          destinationUrl: "https://example.com/paused",
          status: "paused",
          views: 100,
        },
        {
          userId: owner.id,
          slug: "related-links-click-cap",
          title: "Capped related link",
          destinationUrl: "https://example.com/capped",
          maxClicks: 25,
          views: 25,
        },
        {
          userId: otherOwner.id,
          slug: "related-links-other-owner",
          title: "Other creator link",
          destinationUrl: "https://example.com/other",
          views: 200,
        },
      ],
    });

    const response = await request(`/api/links/${current.slug}/visit`, {
      method: "POST",
      headers: { "User-Agent": "Mozilla/5.0 Chrome/124.0.0.0" },
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      relatedLinks: Array<{
        id: string;
        slug: string;
        title: string;
        subtitle: string | null;
        inputType: string;
        coverImageUrl: string | null;
        views: number;
        createdAt: string;
      }>;
    };
    assert.equal(body.relatedLinks.length, 1);
    assert.deepEqual(
      {
        slug: body.relatedLinks[0]?.slug,
        title: body.relatedLinks[0]?.title,
        subtitle: body.relatedLinks[0]?.subtitle,
        inputType: body.relatedLinks[0]?.inputType,
        coverImageUrl: body.relatedLinks[0]?.coverImageUrl,
        views: body.relatedLinks[0]?.views,
      },
      {
        slug: "related-links-visible",
        title: "Visible related link",
        subtitle: "From the same creator",
        inputType: "file",
        coverImageUrl: "https://images.example.com/related.jpg",
        views: 12,
      },
    );

    await prisma.link.deleteMany({
      where: { userId: { in: [owner.id, otherOwner.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [owner.id, otherOwner.id] } },
    });
  });

  it("resolves country, device and browser rules with priority and fallback", async () => {
    const level = await prisma.monetizationLevel.create({
      data: {
        key: "public-route-resolution",
        status: "published",
        routesJson: JSON.stringify([
          {
            id: "fallback",
            countryCode: "ALL",
            countryMode: "include",
            deviceType: "any",
            deviceMode: "include",
            browserFamily: "any",
            browserMode: "include",
            targetUrl: "https://example.com/fallback",
            priority: 0,
            weight: 100,
            enabled: true,
          },
          {
            id: "not-safari",
            countryCode: "ALL",
            countryMode: "include",
            deviceType: "any",
            deviceMode: "include",
            browserFamily: "safari",
            browserMode: "exclude",
            targetUrl: "https://example.com/not-safari",
            priority: 10,
            weight: 100,
            enabled: true,
          },
          {
            id: "outside-vn-non-mobile",
            countryCode: "VN",
            countryMode: "exclude",
            deviceType: "mobile",
            deviceMode: "exclude",
            browserFamily: "any",
            browserMode: "include",
            targetUrl: "https://example.com/outside-vn-non-mobile",
            priority: 15,
            weight: 100,
            enabled: true,
          },
          {
            id: "vn-mobile-chrome",
            countryCode: "VN",
            countryMode: "include",
            deviceType: "mobile",
            deviceMode: "include",
            browserFamily: "chrome",
            browserMode: "include",
            targetUrl: "https://example.com/vn-mobile-chrome",
            priority: 20,
            weight: 100,
            enabled: true,
          },
        ]),
        metaDataJson: JSON.stringify({
          version: 1,
          profitBps: 0,
          stepCount: 2,
          visitorExperience: {
            popup: "none",
            banner: "none",
            interstitial: "none",
            notification: "none",
          },
        }),
      },
    });
    const owner = await prisma.user.create({
      data: {
        name: "Public Route Owner",
        email: "public-route-owner@example.com",
        monetizationLevelId: level.id,
      },
    });
    const link = await prisma.link.create({
      data: {
        userId: owner.id,
        slug: "public-route-resolution",
        title: "Public route resolution",
        destinationType: "url",
        destinationUrl: "https://example.com/original",
      },
    });

    const vnMobileChrome = await request(
      `/api/links/${link.slug}/visit`,
      {
        method: "POST",
        headers: {
          "X-Visitor-Country": "VN",
          "X-Visitor-IP": "203.0.113.10",
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/124.0.0.0 Mobile Safari/537.36",
        },
      },
    );
    assert.equal(vnMobileChrome.status, 200);
    const vnMobileChromeBody = (await vnMobileChrome.json()) as {
      destinationUrl: string;
      monetizationRedirectUrl: string | null;
      visitToken: string;
      showConfig: { pageCount: number };
    };
    assert.equal(
      vnMobileChromeBody.destinationUrl,
      "https://example.com/original",
    );
    assert.equal(
      vnMobileChromeBody.monetizationRedirectUrl,
      "https://example.com/vn-mobile-chrome",
    );
    assert.equal(vnMobileChromeBody.showConfig.pageCount, 2);

    const usDesktopFirefox = await request(
      `/api/links/${link.slug}/visit`,
      {
        method: "POST",
        headers: {
          "X-Visitor-Country": "US",
          "X-Visitor-IP": "203.0.113.11",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
        },
      },
    );
    assert.equal(usDesktopFirefox.status, 200);
    const usDesktopFirefoxBody = (await usDesktopFirefox.json()) as {
      destinationUrl: string;
      monetizationRedirectUrl: string | null;
    };
    assert.equal(
      usDesktopFirefoxBody.destinationUrl,
      "https://example.com/original",
    );
    assert.equal(
      usDesktopFirefoxBody.monetizationRedirectUrl,
      "https://example.com/outside-vn-non-mobile",
    );

    const vnDesktopFirefox = await request(
      `/api/links/${link.slug}/visit`,
      {
        method: "POST",
        headers: {
          "X-Visitor-Country": "VN",
          "X-Visitor-IP": "203.0.113.12",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
        },
      },
    );
    assert.equal(vnDesktopFirefox.status, 200);
    const vnDesktopFirefoxBody = (await vnDesktopFirefox.json()) as {
      destinationUrl: string;
      monetizationRedirectUrl: string | null;
    };
    assert.equal(
      vnDesktopFirefoxBody.destinationUrl,
      "https://example.com/original",
    );
    assert.equal(
      vnDesktopFirefoxBody.monetizationRedirectUrl,
      "https://example.com/not-safari",
    );

    const vnDesktopSafari = await request(
      `/api/links/${link.slug}/visit`,
      {
        method: "POST",
        headers: {
          "X-Visitor-Country": "VN",
          "X-Visitor-IP": "203.0.113.13",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 Version/17.5 Safari/605.1.15",
        },
      },
    );
    assert.equal(vnDesktopSafari.status, 200);
    const vnDesktopSafariBody = (await vnDesktopSafari.json()) as {
      destinationUrl: string;
      monetizationRedirectUrl: string | null;
    };
    assert.equal(
      vnDesktopSafariBody.destinationUrl,
      "https://example.com/original",
    );
    assert.equal(
      vnDesktopSafariBody.monetizationRedirectUrl,
      "https://example.com/fallback",
    );

    assert.equal(
      await prisma.linkAccessLog.count({ where: { linkId: link.id } }),
      4,
    );
    assert.equal(
      await prisma.linkAccessLog.count({
        where: { linkId: link.id, completedAt: { not: null } },
      }),
      0,
    );

    const successfulVisit = await request(
      `/api/links/${link.slug}/visit/${vnMobileChromeBody.visitToken}/complete`,
      { method: "POST" },
    );
    assert.equal(successfulVisit.status, 200);
    const accessLog = await prisma.linkAccessLog.findUniqueOrThrow({
      where: { id: vnMobileChromeBody.visitToken },
      include: { userAgent: true },
    });
    assert.ok(accessLog.completedAt);
    assert.equal(accessLog.country, "VN");
    assert.equal(accessLog.device, 1);
    assert.equal(accessLog.userAgent.browser, "chrome");
    assert.equal(accessLog.ipAddress, "203.0.113.10");

    const dashboard = await request("/api/admin/dashboard?range=7d", {
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });
    assert.equal(dashboard.status, 200);
    const dashboardBody = (await dashboard.json()) as {
      metrics: { unlocks: number; uniqueIps: number };
      recentUnlocks: Array<{ id: string; countryCode: string }>;
    };
    assert.ok(dashboardBody.metrics.unlocks >= 1);
    assert.ok(dashboardBody.metrics.uniqueIps >= 1);
    assert.equal(dashboardBody.recentUnlocks[0]?.id, accessLog.id);
    assert.equal(dashboardBody.recentUnlocks[0]?.countryCode, "VN");

    await prisma.link.delete({ where: { id: link.id } });
    await prisma.user.delete({ where: { id: owner.id } });
    await prisma.monetizationLevel.delete({ where: { id: level.id } });
  });

  it("keeps file destinations separate from the monetization redirect", async () => {
    const level = await prisma.monetizationLevel.create({
      data: {
        key: "public-file-route-resolution",
        status: "published",
        routesJson: JSON.stringify([
          {
            id: "all",
            countryCode: "ALL",
            countryMode: "include",
            deviceType: "any",
            deviceMode: "include",
            browserFamily: "any",
            browserMode: "include",
            targetUrl: "https://example.com/route",
            priority: 10,
            weight: 100,
            enabled: true,
          },
        ]),
      },
    });
    const owner = await prisma.user.create({
      data: {
        name: "Public File Route Owner",
        email: "public-file-route-owner@example.com",
        monetizationLevelId: level.id,
      },
    });
    const link = await prisma.link.create({
      data: {
        userId: owner.id,
        slug: "public-file-route-resolution",
        title: "Public file route resolution",
        destinationType: "file",
        destinationUrl: "https://example.com/original-file",
      },
    });

    const response = await request(`/api/links/${link.slug}/visit`, {
      method: "POST",
      headers: {
        "X-Visitor-Country": "VN",
        "User-Agent": "Mozilla/5.0 Chrome/124.0.0.0",
      },
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      destinationUrl: string;
      monetizationRedirectUrl: string | null;
    };
    assert.equal(body.destinationUrl, "https://example.com/original-file");
    assert.equal(
      body.monetizationRedirectUrl,
      "https://example.com/route",
    );

    await prisma.link.delete({ where: { id: link.id } });
    await prisma.user.delete({ where: { id: owner.id } });
    await prisma.monetizationLevel.delete({ where: { id: level.id } });
  });

  it("tracks a non-monetized destination completion in access logs", async () => {
    const owner = await prisma.user.create({
      data: {
        name: "Standard Visit Owner",
        email: "standard-visit-owner@example.com",
      },
    });
    const link = await prisma.link.create({
      data: {
        userId: owner.id,
        slug: "standard-visit-completion",
        title: "Standard visit completion",
        destinationUrl: "https://example.com/destination",
      },
    });

    const visit = await request(`/api/links/${link.slug}/visit`, {
      method: "POST",
      headers: {
        "X-Visitor-Country": "US",
        "X-Visitor-IP": "203.0.113.70",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
      },
    });
    assert.equal(visit.status, 200);
    const body = (await visit.json()) as {
      monetizationRedirectUrl: string | null;
      visitToken: string;
    };
    assert.equal(body.monetizationRedirectUrl, null);
    assert.ok(body.visitToken);

    const pending = await prisma.linkAccessLog.findUniqueOrThrow({
      where: { id: body.visitToken },
    });
    assert.equal(pending.levelId, null);
    assert.equal(pending.payoutCpm.toString(), "0");
    assert.equal(pending.completedAt, null);

    const completion = await request(
      `/api/links/${link.slug}/visit/${body.visitToken}/complete`,
      { method: "POST" },
    );
    assert.equal(completion.status, 200);
    assert.ok(
      (
        await prisma.linkAccessLog.findUniqueOrThrow({
          where: { id: body.visitToken },
        })
      ).completedAt,
    );

    await prisma.link.delete({ where: { id: link.id } });
    await prisma.user.delete({ where: { id: owner.id } });
  });

  it("completes and aggregates monetized visits exactly once per minute", async () => {
    const level = await prisma.monetizationLevel.create({
      data: {
        key: "visit-aggregation",
        status: "published",
        routesJson: JSON.stringify([
          {
            id: "visit-route",
            countryCode: "ALL",
            countryMode: "include",
            deviceType: "any",
            deviceMode: "include",
            browserFamily: "any",
            browserMode: "include",
            targetUrl: "https://example.com/visit-route",
            priority: 10,
            weight: 100,
            enabled: true,
          },
        ]),
        ratesJson: JSON.stringify([
          {
            countryCode: "VN",
            deviceType: "mobile",
            baseCpm: "10",
            currency: "USD",
            dailyLimit: 1,
            enabled: true,
          },
        ]),
        metaDataJson: JSON.stringify({
          version: 1,
          profitBps: 5_000,
          stepCount: 1,
          visitorExperience: {
            popup: "none",
            banner: "none",
            interstitial: "none",
            notification: "none",
          },
        }),
      },
    });
    const owner = await prisma.user.create({
      data: {
        name: "Visit Aggregation Owner",
        email: "visit-aggregation-owner@example.com",
        monetizationLevelId: level.id,
      },
    });
    const link = await prisma.link.create({
      data: {
        userId: owner.id,
        slug: "visit-aggregation",
        title: "Visit aggregation",
        destinationUrl: "https://example.com/destination",
      },
    });
    const visitHeaders = {
      "X-Visitor-Country": "VN",
      "X-Visitor-IP": "203.0.113.80",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/124.0.0.0 Mobile Safari/537.36",
      Referer: "https://publisher.example/article",
    };

    const firstVisit = await request(`/api/links/${link.slug}/visit`, {
      method: "POST",
      headers: visitHeaders,
    });
    assert.equal(firstVisit.status, 200);
    const firstBody = (await firstVisit.json()) as {
      visitToken: string;
      monetizationRedirectUrl: string;
    };
    assert.ok(firstBody.visitToken);
    assert.equal(
      firstBody.monetizationRedirectUrl,
      "https://example.com/visit-route",
    );

    const pending = await prisma.linkAccessLog.findUniqueOrThrow({
      where: { id: firstBody.visitToken },
    });
    assert.equal(pending.completedAt, null);
    assert.equal(pending.processedAt, null);
    assert.equal(pending.country, "VN");
    assert.equal(pending.device, 1);
    assert.equal(pending.referrer, "https://publisher.example/article");
    assert.equal(pending.payoutCpm.toString(), "5");
    assert.equal(
      await prisma.userAgent.count({ where: { hash: pending.agentHash } }),
      1,
    );

    const completePath =
      `/api/links/${link.slug}/visit/${firstBody.visitToken}/complete`;
    assert.equal(
      (await request(completePath, { method: "POST" })).status,
      200,
    );
    assert.equal(
      (await request(completePath, { method: "POST" })).status,
      200,
    );
    assert.ok(
      (
        await prisma.linkAccessLog.findUniqueOrThrow({
          where: { id: firstBody.visitToken },
        })
      ).completedAt,
    );

    const worker = app.get(LinkAccessAggregationWorker);
    const firstRunAt = new Date(Date.now() + 1_000);
    const firstRun = await worker.processPending(firstRunAt);
    assert.equal(firstRun.processedCount, 1);
    assert.equal(firstRun.earnedViews, 1);
    assert.equal(firstRun.revenue, "0.005");
    const duplicateMinute = await worker.processPending(firstRunAt);
    assert.equal(duplicateMinute.skipped, true);
    assert.equal(duplicateMinute.processedCount, 0);

    const aggregatedLink = await prisma.link.findUniqueOrThrow({
      where: { id: link.id },
    });
    const aggregatedOwner = await prisma.user.findUniqueOrThrow({
      where: { id: owner.id },
    });
    assert.equal(aggregatedLink.views, 1);
    assert.equal(aggregatedLink.revenue.toString(), "0.005");
    assert.equal(aggregatedOwner.balance.toString(), "0.005");
    const secondVisit = await request(`/api/links/${link.slug}/visit`, {
      method: "POST",
      headers: visitHeaders,
    });
    const secondBody = (await secondVisit.json()) as { visitToken: string };
    assert.equal(
      (
        await request(
          `/api/links/${link.slug}/visit/${secondBody.visitToken}/complete`,
          { method: "POST" },
        )
      ).status,
      200,
    );

    const secondRun = await worker.processPending(
      new Date(firstRunAt.getTime() + 60_000),
    );
    assert.equal(secondRun.processedCount, 1);
    assert.equal(secondRun.earnedViews, 0);
    const rejected = await prisma.linkAccessLog.findUniqueOrThrow({
      where: { id: secondBody.visitToken },
    });
    assert.equal(rejected.isEarn, false);
    assert.equal(rejected.rejectReasonMask & 1, 1);

    const unchangedLink = await prisma.link.findUniqueOrThrow({
      where: { id: link.id },
    });
    const unchangedOwner = await prisma.user.findUniqueOrThrow({
      where: { id: owner.id },
    });
    assert.equal(unchangedLink.views, 2);
    assert.equal(unchangedLink.revenue.toString(), "0.005");
    assert.equal(unchangedOwner.balance.toString(), "0.005");

    const noDuplicateRun = await worker.processPending(
      new Date(firstRunAt.getTime() + 120_000),
    );
    assert.equal(noDuplicateRun.processedCount, 0);
    assert.equal(
      (await prisma.link.findUniqueOrThrow({ where: { id: link.id } })).views,
      2,
    );

    await prisma.linkAccessLog.createMany({
      data: Array.from({ length: 1_200 }, (_, index) => ({
        id: `batch-${process.pid}-${index}`,
        linkId: link.id,
        userId: owner.id,
        levelId: level.id,
        agentHash: pending.agentHash,
        ipAddress: `10.20.${Math.floor(index / 250)}.${index % 250}`,
        country: "VN",
        device: 1,
        referrer: "direct",
        payoutCpm: "0",
        completedAt: new Date(firstRunAt.getTime() + 150_000),
      })),
    });

    const fullBatch = await worker.processPending(
      new Date(firstRunAt.getTime() + 180_000),
    );
    assert.equal(fullBatch.processedCount, 1_000);
    assert.equal(fullBatch.batchSize, 1_000);

    const finalBatch = await worker.processPending(
      new Date(firstRunAt.getTime() + 240_000),
    );
    assert.equal(finalBatch.processedCount, 200);
    assert.equal(
      (await prisma.link.findUniqueOrThrow({ where: { id: link.id } })).views,
      1_202,
    );
    assert.equal(
      await prisma.linkAccessLog.count({
        where: { linkId: link.id, processedAt: null },
      }),
      0,
    );

    await prisma.link.delete({ where: { id: link.id } });
    await prisma.user.delete({ where: { id: owner.id } });
    await prisma.monetizationLevel.delete({ where: { id: level.id } });
  });
});
