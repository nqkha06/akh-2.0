/// <reference types="node" />

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { MonetizationAdDto } from "../src/modules/monetization-levels/dto/monetization-level-config.dto";
import { resolveMonetizationAds } from "../src/modules/links/monetization-route-resolver";

const fallback: MonetizationAdDto = {
  id: "fallback-banner",
  name: "Fallback banner",
  enabled: true,
  format: "banner",
  placements: ["safe_overlay_top"],
  priority: 1,
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
    imageUrl: "https://example.com/fallback.webp",
    clickUrl: "https://example.com/fallback",
  },
};

describe("monetization ads resolver", () => {
  it("selects the highest-priority ad matching placement, OS and niche", () => {
    const androidGame: MonetizationAdDto = {
      ...fallback,
      id: "android-game",
      name: "Android game",
      priority: 100,
      targeting: {
        ...fallback.targeting,
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
    };

    const result = resolveMonetizationAds(
      [fallback, androidGame],
      {
        countryCode: "VN",
        deviceType: "mobile",
        operatingSystem: "android",
        browserFamily: "chrome",
        visitorKey: "visitor-1",
      },
      {
        placements: ["safe_overlay_top", "safe_overlay_bottom"],
        deliveryMode: "random_post",
        niches: ["game"],
        siteKey: "wordpress-main",
        postType: "post",
        categoryIds: [7],
        locale: "vi-VN",
      },
    );

    assert.equal(result.length, 1);
    assert.equal(result[0]?.id, "android-game");
    assert.equal(result[0]?.placement, "safe_overlay_top");
  });

  it("falls back when a specific OS rule does not match", () => {
    const result = resolveMonetizationAds(
      [fallback],
      {
        countryCode: "US",
        deviceType: "desktop",
        operatingSystem: "windows",
        browserFamily: "edge",
        visitorKey: "visitor-2",
      },
      { placements: ["safe_overlay_top"] },
    );
    assert.equal(result[0]?.id, "fallback-banner");
  });

  it("keeps unlock Smartlinks out of visual placements and preserves the delay", () => {
    const smartlink: MonetizationAdDto = {
      ...fallback,
      id: "delayed-smartlink",
      name: "Delayed smartlink",
      format: "smartlink",
      placements: ["unlock_redirect", "safe_overlay_top"],
      content: {
        targetUrl: "https://example.com/smartlink",
        redirectDelaySeconds: 8,
      },
    };
    const result = resolveMonetizationAds(
      [smartlink],
      {
        countryCode: "VN",
        deviceType: "mobile",
        operatingSystem: "android",
        browserFamily: "chrome",
        visitorKey: "visitor-3",
      },
      { placements: ["unlock_redirect", "safe_overlay_top"] },
    );
    assert.equal(result.length, 1);
    assert.equal(result[0]?.placement, "unlock_redirect");
    assert.equal(result[0]?.content.redirectDelaySeconds, 8);
  });

  it("resolves a popunder Smartlink independently from unlock redirect", () => {
    const popunder: MonetizationAdDto = {
      ...fallback,
      id: "popunder-campaign",
      name: "Popunder campaign",
      format: "smartlink",
      placements: ["popunder"],
      content: {
        smartlinks: [
          {
            id: "popunder-primary",
            url: "https://example.com/popunder",
            enabled: true,
            weight: 100,
            sortOrder: 0,
          },
        ],
        maxRedirectsPerSession: 1,
      },
    };
    const result = resolveMonetizationAds(
      [popunder],
      {
        countryCode: "VN",
        deviceType: "mobile",
        operatingSystem: "android",
        browserFamily: "chrome",
        visitorKey: "visitor-popunder",
      },
      { placements: ["unlock_redirect", "popunder"] },
    );

    assert.equal(result.length, 1);
    assert.equal(result[0]?.placement, "popunder");
    assert.equal(result[0]?.id, "popunder-primary");
    assert.equal(result[0]?.content.targetUrl, "https://example.com/popunder");
  });

  it("falls through to another smartlink when the visitor reaches a cap", () => {
    const primary: MonetizationAdDto = {
      ...fallback,
      id: "primary-smartlink",
      name: "Primary smartlink",
      format: "smartlink",
      placements: ["unlock_redirect"],
      priority: 100,
      content: {
        targetUrl: "https://example.com/primary",
        maxRedirectsPerSession: 1,
      },
    };
    const fallbackSmartlink: MonetizationAdDto = {
      ...primary,
      id: "secondary-smartlink",
      name: "Secondary smartlink",
      priority: 50,
      content: {
        targetUrl: "https://example.com/secondary",
      },
    };
    const result = resolveMonetizationAds(
      [primary, fallbackSmartlink],
      {
        countryCode: "VN",
        deviceType: "mobile",
        operatingSystem: "android",
        browserFamily: "chrome",
        visitorKey: "visitor-capped",
      },
      {
        placements: ["unlock_redirect"],
        adState: [{ adId: primary.id, timestamps: [Date.now()], sessionCount: 1 }],
      },
    );
    assert.equal(result[0]?.id, fallbackSmartlink.id);
  });

  it("uses weight as a relative traffic ratio for equally prioritized smartlinks", () => {
    const heavy: MonetizationAdDto = {
      ...fallback,
      id: "heavy-smartlink",
      name: "Heavy smartlink",
      format: "smartlink",
      placements: ["unlock_redirect"],
      priority: 100,
      weight: 80,
      content: { targetUrl: "https://example.com/heavy" },
    };
    const light: MonetizationAdDto = {
      ...heavy,
      id: "light-smartlink",
      name: "Light smartlink",
      weight: 20,
      content: { targetUrl: "https://example.com/light" },
    };
    let heavySelections = 0;
    for (let index = 0; index < 1_000; index += 1) {
      const selected = resolveMonetizationAds(
        [heavy, light],
        {
          countryCode: "VN",
          deviceType: "mobile",
          operatingSystem: "android",
          browserFamily: "chrome",
          visitorKey: `weighted-visitor-${index}`,
        },
        { placements: ["unlock_redirect"] },
      );
      if (selected[0]?.id === heavy.id) heavySelections += 1;
    }
    assert.ok(heavySelections >= 700 && heavySelections <= 900, String(heavySelections));
  });

  it("expands nested smartlinks, excludes ineligible links and applies overrides", () => {
    const now = Date.now();
    const campaign: MonetizationAdDto = {
      ...fallback,
      id: "nested-campaign",
      name: "Nested smartlinks",
      format: "smartlink",
      placements: ["unlock_redirect"],
      priority: 100,
      content: {
        redirectDelaySeconds: 5,
        maxRedirectsPerSession: 3,
        smartlinks: [
          {
            id: "nested-capped",
            url: "https://example.com/capped",
            enabled: true,
            weight: 80,
            sortOrder: 20,
            overrides: { maxRedirectsPerSession: 1 },
          },
          {
            id: "nested-active",
            url: "https://example.com/active",
            enabled: true,
            weight: 20,
            sortOrder: 10,
            overrides: { redirectDelaySeconds: 9 },
          },
          {
            id: "nested-disabled",
            url: "https://example.com/disabled",
            enabled: false,
            weight: 100,
            sortOrder: 0,
          },
          {
            id: "nested-expired",
            url: "https://example.com/expired",
            enabled: true,
            weight: 100,
            sortOrder: 30,
            overrides: { endAt: new Date(now - 60_000).toISOString() },
          },
        ],
      },
    };

    const result = resolveMonetizationAds(
      [campaign],
      {
        countryCode: "VN",
        deviceType: "mobile",
        operatingSystem: "android",
        browserFamily: "chrome",
        visitorKey: "nested-visitor",
      },
      {
        placements: ["unlock_redirect"],
        selectionSeed: 42,
        adState: [{ adId: "nested-capped", timestamps: [now], sessionCount: 1 }],
      },
    );

    assert.equal(result.length, 1);
    assert.equal(result[0]?.id, "nested-active");
    assert.equal(result[0]?.content.targetUrl, "https://example.com/active");
    assert.equal(result[0]?.content.redirectDelaySeconds, 9);
    assert.equal(result[0]?.content.smartlinks, undefined);
  });

  it("uses nested smartlink weights as the expected relative distribution", () => {
    const campaign: MonetizationAdDto = {
      ...fallback,
      id: "weighted-campaign",
      name: "Weighted nested smartlinks",
      format: "smartlink",
      placements: ["unlock_redirect"],
      content: {
        smartlinks: [
          { id: "nested-heavy", url: "https://example.com/heavy", enabled: true, weight: 80, sortOrder: 0 },
          { id: "nested-light", url: "https://example.com/light", enabled: true, weight: 20, sortOrder: 10 },
        ],
      },
    };
    let heavySelections = 0;
    for (let index = 0; index < 1_000; index += 1) {
      const selected = resolveMonetizationAds(
        [campaign],
        {
          countryCode: "VN",
          deviceType: "mobile",
          operatingSystem: "android",
          browserFamily: "chrome",
          visitorKey: "nested-weighted-visitor",
        },
        { placements: ["unlock_redirect"], selectionSeed: index },
      );
      if (selected[0]?.id === "nested-heavy") heavySelections += 1;
    }
    assert.ok(heavySelections >= 700 && heavySelections <= 900, String(heavySelections));
  });

  it("honors cooldown, visitor-window caps and campaign schedule", () => {
    const now = Date.now();
    const smartlink: MonetizationAdDto = {
      ...fallback,
      id: "scheduled-smartlink",
      name: "Scheduled smartlink",
      format: "smartlink",
      placements: ["unlock_redirect"],
      content: {
        targetUrl: "https://example.com/scheduled",
        maxRedirectsPerVisitor: 2,
        frequencyWindowHours: 24,
        cooldownMinutes: 10,
        startAt: new Date(now - 60_000).toISOString(),
        endAt: new Date(now + 60_000).toISOString(),
      },
    };
    const capped = resolveMonetizationAds(
      [smartlink],
      {
        countryCode: "VN",
        deviceType: "mobile",
        operatingSystem: "android",
        browserFamily: "chrome",
        visitorKey: "visitor-window-capped",
      },
      {
        placements: ["unlock_redirect"],
        adState: [{
          adId: smartlink.id,
          timestamps: [now - 1_000, now - 3_600_000],
          sessionCount: 0,
        }],
      },
    );
    assert.equal(capped.length, 0);

    const future = {
      ...smartlink,
      content: {
        ...smartlink.content,
        startAt: new Date(now + 3_600_000).toISOString(),
      },
    };
    assert.equal(
      resolveMonetizationAds(
        [future],
        {
          countryCode: "VN",
          deviceType: "mobile",
          operatingSystem: "android",
          browserFamily: "chrome",
          visitorKey: "visitor-future",
        },
        { placements: ["unlock_redirect"] },
      ).length,
      0,
    );
  });
});
