/// <reference types="node" />

import "reflect-metadata";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BadRequestException, NotFoundException } from "@nestjs/common";

import {
  buildWebsiteSettingsPersistence,
  parseWebsiteSocialLinks,
} from "../src/modules/site-settings/site-settings.mapper";
import {
  assertUniqueWebsiteSocialPlatforms,
  assertWebsiteBrandingMedia,
} from "../src/modules/site-settings/site-settings.policy";

describe("Site settings mapper and policy", () => {
  it("parses only complete, supported HTTPS social links", () => {
    assert.deepEqual(
      parseWebsiteSocialLinks(
        JSON.stringify([
          {
            platform: "github",
            url: "https://github.com/example",
            isActive: true,
            sortOrder: 2,
          },
          {
            platform: "unknown",
            url: "https://example.com",
            isActive: true,
            sortOrder: 1,
          },
          {
            platform: "facebook",
            url: "javascript:alert(1)",
            isActive: true,
            sortOrder: 0,
          },
        ]),
      ),
      [
        {
          platform: "github",
          url: "https://github.com/example",
          isActive: true,
          sortOrder: 2,
        },
      ],
    );
    assert.deepEqual(parseWebsiteSocialLinks("invalid"), []);
  });

  it("sorts social links for persistence without mutating the DTO", () => {
    const socialLinks = [
      {
        platform: "github" as const,
        url: "https://github.com/example",
        isActive: true,
        sortOrder: 2,
      },
      {
        platform: "facebook" as const,
        url: "https://facebook.com/example",
        isActive: false,
        sortOrder: 1,
      },
    ];
    const persistence = buildWebsiteSettingsPersistence({
      siteName: "STU",
      socialLinks,
    });

    assert.deepEqual(
      JSON.parse(persistence.socialLinksJson),
      [socialLinks[1], socialLinks[0]],
    );
    assert.deepEqual(socialLinks.map(({ platform }) => platform), [
      "github",
      "facebook",
    ]);
  });

  it("rejects duplicate platforms and invalid branding media", () => {
    const duplicate = {
      platform: "github" as const,
      url: "https://github.com/example",
      isActive: true,
      sortOrder: 0,
    };
    assert.throws(
      () => assertUniqueWebsiteSocialPlatforms([duplicate, duplicate]),
      BadRequestException,
    );
    assert.throws(
      () => assertWebsiteBrandingMedia(["missing"], []),
      NotFoundException,
    );
    assert.throws(
      () =>
        assertWebsiteBrandingMedia(
          ["document"],
          [{ id: "document", mimeType: "application/pdf" }],
        ),
      BadRequestException,
    );
  });
});
