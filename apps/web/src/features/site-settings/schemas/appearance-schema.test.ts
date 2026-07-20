import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { appearanceSettingsSchema } from "./appearance-schema.ts";

const validSettings = {
  siteName: "STU",
  siteShortName: "",
  siteDescription: "",
  siteTagline: "",
  siteUrl: "https://example.com",
  logoLightId: null,
  logoDarkId: null,
  logoIconId: null,
  faviconId: null,
  defaultOgImageId: null,
  socialLinks: [
    {
      platform: "github",
      url: "https://github.com/example",
      isActive: true,
      sortOrder: 0,
    },
  ],
  contactEmail: "hello@example.com",
  supportEmail: "",
  phone: "",
  address: "",
  workingHours: "",
  mapUrl: "",
} as const;

describe("appearance settings schema", () => {
  it("accepts a valid settings form", () => {
    assert.equal(appearanceSettingsSchema.safeParse(validSettings).success, true);
  });

  it("rejects insecure social URLs and duplicate platforms", () => {
    const result = appearanceSettingsSchema.safeParse({
      ...validSettings,
      socialLinks: [
        { ...validSettings.socialLinks[0], url: "http://github.com/example" },
        { ...validSettings.socialLinks[0], url: "https://github.com/another" },
      ],
    });
    assert.equal(result.success, false);
  });
});
