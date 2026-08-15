import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  adminAccessToken,
  request,
} from "../e2e-harness";

describe("Admin Loyalty tiers E2E", () => {
  const benefits = (locale: "vi" | "en") => [
    {
      key: "csv_export",
      label: locale === "vi" ? "Xuất CSV" : "CSV export",
      included: true,
      value: null,
    },
    {
      key: "custom_qr",
      label: locale === "vi" ? "QR tùy chỉnh" : "Custom QR",
      included: false,
      value: null,
    },
  ];
  const payload = {
    key: "admin-loyalty-test",
    minimumValidViews: 123_456,
    sortOrder: 90,
    iconKey: "trophy",
    status: "published",
    translations: [
      {
        locale: "vi",
        name: "Hạng kiểm thử",
        description: "Mô tả quản trị Loyalty.",
        benefits: benefits("vi"),
      },
      {
        locale: "en",
        name: "Test tier",
        description: "Loyalty administration description.",
        benefits: benefits("en"),
      },
    ],
  };

  it("supports protected CRUD and preserves check/X states across locales", async () => {
    assert.ok(adminAccessToken);
    const authorization = { Authorization: `Bearer ${adminAccessToken}` };
    assert.equal((await request("/api/admin/loyalty-tiers")).status, 401);

    const createResponse = await request("/api/admin/loyalty-tiers", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify(payload),
    });
    assert.equal(createResponse.status, 201, await createResponse.clone().text());
    const created = (await createResponse.json()) as {
      id: number;
      displayName: string;
      benefitsCount: number;
      includedBenefitsCount: number;
      translations: Array<{
        locale: string;
        benefits: Array<{ key: string; included: boolean }>;
      }>;
    };
    assert.equal(created.displayName, "Hạng kiểm thử");
    assert.equal(created.benefitsCount, 2);
    assert.equal(created.includedBenefitsCount, 1);
    assert.equal(
      created.translations.find(({ locale }) => locale === "en")?.benefits[1]
        ?.included,
      false,
    );

    const duplicateThreshold = await request("/api/admin/loyalty-tiers", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify({ ...payload, key: "admin-loyalty-duplicate" }),
    });
    assert.equal(duplicateThreshold.status, 409);

    const inconsistentBenefits = await request(
      `/api/admin/loyalty-tiers/${created.id}`,
      {
        method: "PATCH",
        headers: authorization,
        body: JSON.stringify({
          translations: [
            payload.translations[0],
            {
              ...payload.translations[1],
              benefits: benefits("en").map((benefit, index) =>
                index === 1 ? { ...benefit, included: true } : benefit,
              ),
            },
          ],
        }),
      },
    );
    assert.equal(inconsistentBenefits.status, 400);

    const updateResponse = await request(
      `/api/admin/loyalty-tiers/${created.id}`,
      {
        method: "PATCH",
        headers: authorization,
        body: JSON.stringify({
          sortOrder: 95,
          status: "draft",
          translations: payload.translations.map((translation) => ({
            ...translation,
            benefits: translation.benefits.map((benefit) => ({
              ...benefit,
              included: false,
            })),
          })),
        }),
      },
    );
    assert.equal(updateResponse.status, 200, await updateResponse.clone().text());
    const updated = (await updateResponse.json()) as {
      status: string;
      sortOrder: number;
      includedBenefitsCount: number;
    };
    assert.equal(updated.status, "draft");
    assert.equal(updated.sortOrder, 95);
    assert.equal(updated.includedBenefitsCount, 0);

    const listResponse = await request(
      "/api/admin/loyalty-tiers?name=admin-loyalty&page=1&perPage=10",
      { headers: authorization },
    );
    assert.equal(listResponse.status, 200);
    const list = (await listResponse.json()) as {
      total: number;
      summary: { configuredBenefits: number; highestThreshold: number };
    };
    assert.equal(list.total, 1);
    assert.equal(list.summary.configuredBenefits, 2);
    assert.equal(list.summary.highestThreshold, 123_456);

    assert.equal(
      (
        await request(`/api/admin/loyalty-tiers/${created.id}`, {
          method: "DELETE",
          headers: authorization,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request(`/api/admin/loyalty-tiers/${created.id}`, {
          headers: authorization,
        })
      ).status,
      404,
    );
  });
});

