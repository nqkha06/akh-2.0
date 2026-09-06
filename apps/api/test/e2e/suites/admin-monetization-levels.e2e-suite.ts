import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  adminAccessToken,
  login,
  prisma,
  request,
} from "../e2e-harness";

describe("Admin monetization levels E2E", () => {
  const payload = (key: string, isDefault = false) => ({
    key,
    status: "published",
    isDefault,
    sortOrder: 10,
    translations: [
      {
        locale: "vi",
        name: `Cấp độ ${key}`,
        description: "Mô tả kiểm thử.",
      },
      {
        locale: "en",
        name: `Level ${key}`,
        description: "Test description.",
      },
    ],
    metaData: {
      version: 1,
      profitBps: 100,
      stepCount: 1,
      visitorExperience: {
        popup: "limited",
        banner: "none",
        interstitial: "none",
        notification: "none",
      },
    },
    routes: [],
    rates: [],
  });

  it("supports validated CRUD, translations and a single default level", async () => {
    assert.ok(adminAccessToken);
    const authorization = {
      Authorization: `Bearer ${adminAccessToken}`,
    };
    assert.equal((await request("/api/admin/monetization-levels")).status, 401);

    const firstResponse = await request("/api/admin/monetization-levels", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify(payload("test-clean", true)),
    });
    assert.equal(firstResponse.status, 201, await firstResponse.clone().text());
    const first = (await firstResponse.json()) as {
      id: number;
      isDefault: boolean;
      translations: Array<{ locale: string }>;
    };
    assert.equal(first.isDefault, true);
    assert.deepEqual(
      first.translations.map(({ locale }) => locale),
      ["en", "vi"],
    );

    const duplicateResponse = await request("/api/admin/monetization-levels", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify(payload("test-clean")),
    });
    assert.equal(duplicateResponse.status, 409);

    const secondResponse = await request("/api/admin/monetization-levels", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify({
        ...payload("test-balanced", true),
        sortOrder: 20,
      }),
    });
    assert.equal(secondResponse.status, 201);
    const second = (await secondResponse.json()) as {
      id: number;
      isDefault: boolean;
    };
    assert.equal(second.isDefault, true);
    assert.equal(
      (
        await prisma.monetizationLevel.findUniqueOrThrow({
          where: { id: first.id },
        })
      ).isDefault,
      false,
    );

    const updatedResponse = await request(
      `/api/admin/monetization-levels/${first.id}`,
      {
        method: "PATCH",
        headers: authorization,
        body: JSON.stringify({
          routes: [
            {
              id: "route-vn-mobile",
              countryCode: "VN",
              countryMode: "exclude",
              deviceType: "mobile",
              deviceMode: "exclude",
              browserFamily: "safari",
              browserMode: "exclude",
              targetUrl: "https://example.com/vn",
              priority: 10,
              weight: 100,
              enabled: true,
            },
          ],
          rates: [
            {
              countryCode: "VN",
              deviceType: "mobile",
              baseCpm: "1.2500",
              currency: "USD",
              dailyLimit: 1000,
              enabled: true,
            },
          ],
          ads: [
            {
              id: "banner-vn-android",
              name: "Banner VN Android",
              enabled: true,
              format: "banner",
              placements: ["safe_overlay_top"],
              priority: 100,
              weight: 100,
              targeting: {
                countries: ["VN"],
                devices: ["mobile"],
                operatingSystems: ["android"],
                browsers: ["chrome"],
                deliveryModes: ["random_post"],
                niches: ["game"],
                siteKeys: ["wordpress-main"],
                postTypes: ["post"],
                categoryIds: [7],
                locales: ["vi-VN"],
              },
              content: {
                imageUrl: "https://example.com/banner.webp",
                clickUrl: "https://example.com/campaign",
                ctaLabel: "Mở ngay",
                newTab: true,
              },
            },
            {
              id: "smartlink-campaign",
              name: "Smartlink campaign",
              enabled: true,
              format: "smartlink",
              placements: ["unlock_redirect"],
              priority: 90,
              weight: 100,
              targeting: {
                countries: ["ALL"],
                devices: ["any"],
                operatingSystems: ["any"],
                browsers: ["any"],
                deliveryModes: ["any"],
                niches: ["any"],
                siteKeys: [],
                postTypes: [],
                categoryIds: [],
                locales: [],
              },
              content: {
                redirectDelaySeconds: 5,
                maxRedirectsPerSession: 2,
                maxRedirectsPerVisitor: 4,
                frequencyWindowHours: 24,
                cooldownMinutes: 10,
                smartlinks: [
                  {
                    id: "smartlink-primary",
                    url: "https://example.com/smartlink-primary",
                    enabled: true,
                    weight: 80,
                    sortOrder: 0,
                  },
                  {
                    id: "smartlink-secondary",
                    url: "https://example.com/smartlink-secondary",
                    enabled: true,
                    weight: 20,
                    sortOrder: 10,
                    overrides: { cooldownMinutes: 30 },
                  },
                ],
              },
            },
            {
              id: "popunder-campaign",
              name: "Popunder campaign",
              enabled: true,
              format: "smartlink",
              placements: ["popunder"],
              priority: 80,
              weight: 100,
              targeting: {
                countries: ["ALL"],
                devices: ["any"],
                operatingSystems: ["any"],
                browsers: ["any"],
                deliveryModes: ["any"],
                niches: ["any"],
                siteKeys: [],
                postTypes: [],
                categoryIds: [],
                locales: [],
              },
              content: {
                maxRedirectsPerSession: 1,
                maxRedirectsPerVisitor: 2,
                frequencyWindowHours: 24,
                cooldownMinutes: 30,
                smartlinks: [
                  {
                    id: "popunder-primary",
                    url: "https://example.com/popunder-primary",
                    enabled: true,
                    weight: 100,
                    sortOrder: 0,
                  },
                ],
              },
            },
          ],
          metaData: {
            version: 1,
            profitBps: 250,
            stepCount: 2,
            visitorExperience: {
              popup: "limited",
              banner: "limited",
              interstitial: "none",
              notification: "none",
            },
          },
        }),
      },
    );
    assert.equal(
      updatedResponse.status,
      200,
      await updatedResponse.clone().text(),
    );
    const updated = (await updatedResponse.json()) as {
      routes: Array<{
        countryMode: string;
        deviceMode: string;
        browserMode: string;
      }>;
      rates: unknown[];
      ads: Array<{
        id: string;
        format: string;
        placements: string[];
        content: { smartlinks?: Array<{ id: string; weight: number }> };
      }>;
      metaData: { profitBps: number };
    };
    assert.equal(updated.routes.length, 1);
    assert.equal(updated.routes[0]?.countryMode, "exclude");
    assert.equal(updated.routes[0]?.deviceMode, "exclude");
    assert.equal(updated.routes[0]?.browserMode, "exclude");
    assert.equal(updated.rates.length, 1);
    assert.equal(updated.ads.length, 3);
    assert.equal(updated.ads[0]?.id, "banner-vn-android");
    assert.equal(updated.ads[0]?.format, "banner");
    assert.equal(updated.ads[1]?.content.smartlinks?.length, 2);
    assert.equal(updated.ads[1]?.content.smartlinks?.[0]?.weight, 80);
    assert.deepEqual(updated.ads[2]?.placements, ["popunder"]);
    assert.equal(updated.ads[2]?.content.smartlinks?.[0]?.id, "popunder-primary");
    assert.equal(updated.metaData.profitBps, 250);

    const invalidExcludedCountries = await request(
      `/api/admin/monetization-levels/${first.id}`,
      {
        method: "PATCH",
        headers: authorization,
        body: JSON.stringify({
          routes: [
            {
              id: "route-invalid-exclusion",
              countryCode: "ALL",
              countryMode: "exclude",
              deviceType: "any",
              browserFamily: "any",
              targetUrl: "https://example.com/invalid",
              priority: 10,
              weight: 100,
              enabled: true,
            },
          ],
        }),
      },
    );
    assert.equal(invalidExcludedCountries.status, 400);

    const invalidExcludedDevices = await request(
      `/api/admin/monetization-levels/${first.id}`,
      {
        method: "PATCH",
        headers: authorization,
        body: JSON.stringify({
          routes: [
            {
              id: "route-invalid-device-exclusion",
              countryCode: "VN",
              countryMode: "include",
              deviceType: "any",
              deviceMode: "exclude",
              browserFamily: "any",
              browserMode: "include",
              targetUrl: "https://example.com/invalid",
              priority: 10,
              weight: 100,
              enabled: true,
            },
          ],
        }),
      },
    );
    assert.equal(invalidExcludedDevices.status, 400);

    const invalidExcludedBrowsers = await request(
      `/api/admin/monetization-levels/${first.id}`,
      {
        method: "PATCH",
        headers: authorization,
        body: JSON.stringify({
          routes: [
            {
              id: "route-invalid-browser-exclusion",
              countryCode: "VN",
              countryMode: "include",
              deviceType: "any",
              deviceMode: "include",
              browserFamily: "any",
              browserMode: "exclude",
              targetUrl: "https://example.com/invalid",
              priority: 10,
              weight: 100,
              enabled: true,
            },
          ],
        }),
      },
    );
    assert.equal(invalidExcludedBrowsers.status, 400);

    const listResponse = await request(
      "/api/admin/monetization-levels?name=test&page=1&perPage=10",
      { headers: authorization },
    );
    assert.equal(listResponse.status, 200);
    const listResult = (await listResponse.json()) as {
      total: number;
      summary: {
        publishedLevels: number;
        configuredRoutes: number;
        configuredRates: number;
        assignedUsers: number;
      };
    };
    assert.equal(listResult.total, 2);
    assert.equal(listResult.summary.publishedLevels, 2);
    assert.equal(listResult.summary.configuredRoutes, 1);
    assert.equal(listResult.summary.configuredRates, 1);
    assert.equal(listResult.summary.assignedUsers, 0);

    const invalidRates = await request(
      `/api/admin/monetization-levels/${first.id}`,
      {
        method: "PATCH",
        headers: authorization,
        body: JSON.stringify({
          rates: [
            {
              countryCode: "VN",
              deviceType: "any",
              baseCpm: "1.00",
              currency: "USD",
              enabled: true,
            },
            {
              countryCode: "VN",
              deviceType: "any",
              baseCpm: "2.00",
              currency: "USD",
              enabled: true,
            },
          ],
        }),
      },
    );
    assert.equal(invalidRates.status, 400);

    const owner = await prisma.user.findUniqueOrThrow({
      where: { email: "auth@example.com" },
    });
    const linked = await prisma.link.create({
      data: {
        userId: owner.id,
        slug: "monetized-link-test",
        title: "Monetized link test",
      },
    });
    const memberSession = await login();
    const memberLevelsResponse = await request(
      "/api/member/monetization-levels",
      {
        headers: {
          Authorization: `Bearer ${memberSession.body.accessToken}`,
        },
      },
    );
    assert.equal(
      memberLevelsResponse.status,
      200,
      await memberLevelsResponse.clone().text(),
    );
    const memberLevels = (await memberLevelsResponse.json()) as {
      items: Array<{
        id: number;
        rates: unknown[];
        routes?: unknown[];
      }>;
      total: number;
      selectedLevelId: number | null;
      effectiveLevelId: number | null;
      usesSystemDefault: boolean;
      totalLinks: number;
    };
    assert.equal(memberLevels.total, 2);
    assert.equal(memberLevels.selectedLevelId, null);
    assert.equal(memberLevels.effectiveLevelId, second.id);
    assert.equal(memberLevels.usesSystemDefault, true);
    assert.equal(memberLevels.totalLinks, 1);
    assert.equal(
      memberLevels.items.find((level) => level.id === first.id)?.rates.length,
      1,
    );
    assert.equal(
      "routes" in
        (memberLevels.items.find((level) => level.id === first.id) ?? {}),
      false,
    );
    const selectFirstResponse = await request(
      "/api/member/monetization-levels/selection",
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${memberSession.body.accessToken}`,
        },
        body: JSON.stringify({ monetizationLevelId: first.id }),
      },
    );
    assert.equal(
      selectFirstResponse.status,
      200,
      await selectFirstResponse.clone().text(),
    );
    assert.equal(
      (
        await prisma.user.findUniqueOrThrow({
          where: { id: owner.id },
        })
      ).monetizationLevelId,
      first.id,
    );
    assert.equal(
      (
        await request(`/api/admin/monetization-levels/${first.id}`, {
          method: "DELETE",
          headers: authorization,
        })
      ).status,
      409,
    );
    const selectSecondResponse = await request(
      "/api/member/monetization-levels/selection",
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${memberSession.body.accessToken}`,
        },
        body: JSON.stringify({ monetizationLevelId: second.id }),
      },
    );
    assert.equal(selectSecondResponse.status, 200);
    await prisma.link.delete({ where: { id: linked.id } });
    assert.equal(
      (
        await request(`/api/admin/monetization-levels/${first.id}`, {
          method: "DELETE",
          headers: authorization,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request(`/api/admin/monetization-levels/${second.id}`, {
          method: "DELETE",
          headers: authorization,
        })
      ).status,
      400,
    );
  });
});
