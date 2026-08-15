/// <reference types="node" />

import "reflect-metadata";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BadRequestException, ConflictException } from "@nestjs/common";
import { Prisma, type BusinessSettings } from "@prisma/client";
import { DEFAULT_BACKGROUND_IMAGE_PRESETS } from "@stu/contracts";

import {
  mapPublicBusinessSettings,
  mapRuntimeBusinessSettings,
  parseStringArray,
} from "../src/modules/business-settings/business-settings.mapper";
import {
  assertUniqueBusinessPresetIds,
  getActiveBusinessCurrencies,
  parseReferralCommissionRate,
  throwBusinessSettingsVersionConflict,
} from "../src/modules/business-settings/business-settings.policy";

function settings(overrides: Partial<BusinessSettings> = {}) {
  return {
    id: 1,
    version: 3,
    registrationEnabled: true,
    emailVerificationRequired: false,
    googleLoginEnabled: true,
    baseCurrencyCode: "USD",
    withdrawalCurrencyCode: "USD",
    referralCommissionRate: new Prisma.Decimal(5),
    loyaltyWindowDays: 7,
    loyaltyHistoryDays: 7,
    memberFileMaxBytes: BigInt(100),
    coverImageMaxBytes: BigInt(50),
    adminMediaMaxBytes: BigInt(50),
    supportAttachmentMaxBytes: BigInt(25),
    memberStorageQuotaBytes: BigInt(1_000),
    uploadAllowedMimeTypesJson: JSON.stringify(["image/png"]),
    backgroundImagesJson: JSON.stringify([
      {
        id: "active",
        name: "Active",
        imageUrl: "https://example.com/active.jpg",
        categories: ["Test"],
        enabled: true,
      },
      {
        id: "inactive",
        name: "Inactive",
        imageUrl: "https://example.com/inactive.jpg",
        categories: ["Test"],
        enabled: false,
      },
    ]),
    backgroundVideosJson: "invalid",
    maintenanceMode: false,
    withdrawalsPaused: false,
    updatedById: null,
    createdAt: new Date("2026-08-08T00:00:00.000Z"),
    updatedAt: new Date("2026-08-08T01:00:00.000Z"),
    ...overrides,
  } satisfies BusinessSettings;
}

describe("Business settings mapper and policy", () => {
  it("maps runtime numeric values and safely falls back for invalid JSON", () => {
    const runtime = mapRuntimeBusinessSettings(settings());
    assert.equal(runtime.memberFileMaxBytes, 100);
    assert.deepEqual(runtime.uploadAllowedMimeTypes, ["image/png"]);
    assert.deepEqual(runtime.backgroundImages.map(({ id }) => id), [
      "active",
      "inactive",
    ]);
    assert.ok(runtime.backgroundVideos.length > 0);
    assert.deepEqual(parseStringArray("{}", ["fallback"]), ["fallback"]);

    const publicSettings = mapPublicBusinessSettings(runtime);
    assert.deepEqual(
      publicSettings.presetLibrary.images.map(({ id }) => id),
      ["active"],
    );
  });

  it("falls back when a stored preset has an unsafe shape", () => {
    const runtime = mapRuntimeBusinessSettings(
      settings({ backgroundImagesJson: JSON.stringify([{ id: 1 }]) }),
    );
    assert.deepEqual(runtime.backgroundImages, DEFAULT_BACKGROUND_IMAGE_PRESETS);
  });

  it("validates preset IDs, rates, currencies and version conflicts", () => {
    assert.throws(
      () => assertUniqueBusinessPresetIds([{ id: "same" }, { id: "same" }], "ảnh"),
      BadRequestException,
    );
    assert.equal(parseReferralCommissionRate("5.25").toString(), "5.25");
    assert.throws(() => parseReferralCommissionRate("101"), BadRequestException);

    const usd = {
      id: 1,
      code: "USD",
      name: "US Dollar",
      symbol: "$",
      exchangeRate: new Prisma.Decimal(1),
      isBase: true,
      isDefault: true,
      isActive: true,
    };
    assert.equal(
      getActiveBusinessCurrencies([usd], "USD", "USD").baseCurrency,
      usd,
    );
    assert.throws(
      () => getActiveBusinessCurrencies([usd], "EUR", "USD"),
      BadRequestException,
    );
    assert.throws(
      () => throwBusinessSettingsVersionConflict(),
      ConflictException,
    );
  });
});
