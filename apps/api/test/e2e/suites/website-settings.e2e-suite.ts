import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { SUPPORT_SETTINGS_OPENAPI_ROUTE_SNAPSHOT } from "../../contracts/support-settings-api.contract";
import {
  adminAccessToken,
  app,
  request,
} from "../e2e-harness";

describe("Website settings E2E", () => {
  it("preserves the support and settings OpenAPI route snapshot", () => {
    const openApi = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle("Support settings contract").build(),
      { deepScanRoutes: true },
    );
    const prefixes = [
      "/api/admin/link-reports",
      "/api/public/link-reports",
      "/api/member/snippets",
      "/api/admin/settings/appearance",
      "/api/admin/settings/business",
      "/api/site-config",
      "/api/business-config",
    ];
    const httpMethods = new Set([
      "delete",
      "get",
      "head",
      "options",
      "patch",
      "post",
      "put",
      "trace",
    ]);
    const routes = Object.fromEntries(
      Object.entries(openApi.paths)
        .filter(([path]) => prefixes.some((prefix) => path.startsWith(prefix)))
        .map(([path, definition]) => [
          path,
          Object.keys(definition ?? {})
            .filter((key) => httpMethods.has(key))
            .sort(),
        ]),
    );

    assert.deepEqual(routes, SUPPORT_SETTINGS_OPENAPI_ROUTE_SNAPSHOT);
  });

  it("protects admin settings, validates input and exposes only public fields", async () => {
    assert.ok(adminAccessToken);
    const authorization = {
      Authorization: `Bearer ${adminAccessToken}`,
    };

    assert.equal(
      (await request("/api/admin/settings/appearance")).status,
      401,
    );

    const updateResponse = await request("/api/admin/settings/appearance", {
      method: "PATCH",
      headers: authorization,
      body: JSON.stringify({
        siteName: "STU Test",
        siteShortName: "STU",
        siteDescription: "Website settings integration test.",
        siteTagline: "Settings without restart.",
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
          {
            platform: "facebook",
            url: "https://facebook.com/example",
            isActive: false,
            sortOrder: 1,
          },
        ],
        contactEmail: "contact@example.com",
        supportEmail: null,
        phone: null,
        address: null,
        workingHours: null,
        mapUrl: null,
      }),
    });
    assert.equal(
      updateResponse.status,
      200,
      await updateResponse.clone().text(),
    );
    const adminBody = (await updateResponse.json()) as {
      siteName: string;
      socialLinks: Array<{ platform: string }>;
    };
    assert.equal(adminBody.siteName, "STU Test");
    assert.equal(adminBody.socialLinks.length, 2);

    const publicResponse = await request("/api/site-config");
    assert.equal(publicResponse.status, 200);
    const publicBody = (await publicResponse.json()) as {
      siteName: string;
      socialLinks: Array<{ platform: string }>;
      updatedById?: number;
    };
    assert.equal(publicBody.siteName, "STU Test");
    assert.deepEqual(
      publicBody.socialLinks.map((link) => link.platform),
      ["github"],
    );
    assert.equal("updatedById" in publicBody, false);

    const invalidResponse = await request("/api/admin/settings/appearance", {
      method: "PATCH",
      headers: authorization,
      body: JSON.stringify({
        ...adminBody,
        siteUrl: "not-a-url",
        socialLinks: [],
        contactEmail: null,
        supportEmail: null,
        phone: null,
        address: null,
        workingHours: null,
        mapUrl: null,
      }),
    });
    assert.equal(invalidResponse.status, 400);
  });
});
