import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { CATALOG_OPENAPI_ROUTE_SNAPSHOT } from "../../contracts/catalog-api.contract";
import {
  adminAccessToken,
  app,
  prisma,
  request,
} from "../e2e-harness";

describe("Languages E2E", () => {
  it("preserves the catalog CRUD OpenAPI route snapshot", () => {
    const openApi = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle("Catalog contract").build(),
      { deepScanRoutes: true },
    );
    const prefixes = [
      "/api/admin/languages",
      "/api/languages",
      "/api/admin/settings/currencies",
      "/api/member/preferences/currency",
      "/api/admin/payment-methods",
      "/api/member/payment-methods",
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

    assert.deepEqual(routes, CATALOG_OPENAPI_ROUTE_SNAPSHOT);
  });

  it("manages published locales and preserves exactly one default", async () => {
    assert.ok(adminAccessToken);
    const authorization = {
      Authorization: `Bearer ${adminAccessToken}`,
    };
    assert.equal((await request("/api/admin/languages")).status, 401);
    const createdResponse = await request("/api/admin/languages", {
      method: "POST",
      headers: authorization,
      body: JSON.stringify({
        name: "Japanese",
        nativeName: "日本語",
        locale: "ja",
        code: "ja",
        regional: "ja-JP",
        flag: "JP",
        isDefault: false,
        status: "published",
        sortOrder: 30,
        isRtl: false,
      }),
    });
    assert.equal(
      createdResponse.status,
      201,
      await createdResponse.clone().text(),
    );
    const japanese = (await createdResponse.json()) as { id: number };

    const uiTranslationsResponse = await request(
      `/api/admin/languages/${japanese.id}/ui-translations`,
      { headers: authorization },
    );
    assert.equal(uiTranslationsResponse.status, 200);
    assert.equal(
      ((await uiTranslationsResponse.json()) as { version: number }).version,
      1,
    );
    const savedUiTranslations = await request(
      `/api/admin/languages/${japanese.id}/ui-translations`,
      {
        method: "PATCH",
        headers: authorization,
        body: JSON.stringify({
          version: 1,
          catalogSize: 2,
          entries: [{ key: "Common.language", value: "言語" }],
        }),
      },
    );
    assert.equal(
      savedUiTranslations.status,
      200,
      await savedUiTranslations.clone().text(),
    );
    assert.equal(
      (
        (await savedUiTranslations.json()) as {
          translatedKeys: number;
          version: number;
        }
      ).translatedKeys,
      1,
    );
    assert.equal(
      (
        await request(`/api/admin/languages/${japanese.id}/ui-translations`, {
          method: "PATCH",
          headers: authorization,
          body: JSON.stringify({
            version: 1,
            catalogSize: 2,
            entries: [],
          }),
        })
      ).status,
      409,
    );
    const publicUiMessages = await request(
      "/api/languages/ja/ui-messages",
    );
    assert.equal(publicUiMessages.status, 200);
    assert.deepEqual(
      ((await publicUiMessages.json()) as { messages: Record<string, string> })
        .messages,
      { "Common.language": "言語" },
    );

    assert.equal(
      (
        await request("/api/admin/languages", {
          method: "POST",
          headers: authorization,
          body: JSON.stringify({
            name: "Duplicate Japanese",
            locale: "ja",
            code: "jx",
            isDefault: false,
            status: "published",
            sortOrder: 40,
            isRtl: false,
          }),
        })
      ).status,
      409,
    );

    assert.equal(
      (
        await request(`/api/admin/languages/${japanese.id}/default`, {
          method: "PATCH",
          headers: authorization,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request(`/api/admin/languages/${japanese.id}`, {
          method: "PATCH",
          headers: authorization,
          body: JSON.stringify({ status: "draft" }),
        })
      ).status,
      400,
    );
    const publicResponse = await request("/api/languages");
    assert.equal(publicResponse.status, 200);
    assert.equal(
      ((await publicResponse.json()) as { defaultLocale: string })
        .defaultLocale,
      "ja",
    );
    const missingDefaultTranslation = await request(
      "/api/admin/payment-methods",
      {
        method: "POST",
        headers: authorization,
        body: JSON.stringify({
          withdrawFee: "0",
          minWithdrawAmount: "1000",
          status: "published",
          translations: [
            {
              locale: "vi",
              name: "Ngân hàng",
              fields: [
                {
                  key: "account_number",
                  label: "Số tài khoản",
                  type: "text",
                  required: true,
                },
              ],
            },
          ],
        }),
      },
    );
    assert.equal(missingDefaultTranslation.status, 400);
    const localizedMethodResponse = await request(
      "/api/admin/payment-methods",
      {
        method: "POST",
        headers: authorization,
        body: JSON.stringify({
          withdrawFee: "0",
          minWithdrawAmount: "1000",
          status: "published",
          translations: [
            {
              locale: "ja",
              name: "銀行振込",
              fields: [
                {
                  key: "account_number",
                  label: "口座番号",
                  type: "text",
                  required: true,
                },
              ],
            },
          ],
        }),
      },
    );
    assert.equal(
      localizedMethodResponse.status,
      201,
      await localizedMethodResponse.clone().text(),
    );
    const localizedMethod = (await localizedMethodResponse.json()) as {
      id: number;
    };
    assert.equal(
      (
        await request(
          `/api/admin/payment-methods/${localizedMethod.id}`,
          {
            method: "DELETE",
            headers: authorization,
          },
        )
      ).status,
      200,
    );

    const vietnamese = await prisma.language.findUniqueOrThrow({
      where: { locale: "vi" },
    });
    assert.equal(
      (
        await request(`/api/admin/languages/${vietnamese.id}/default`, {
          method: "PATCH",
          headers: authorization,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request(`/api/admin/languages/${japanese.id}`, {
          method: "DELETE",
          headers: authorization,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request(`/api/admin/languages/${vietnamese.id}`, {
          method: "DELETE",
          headers: authorization,
        })
      ).status,
      409,
    );
  });
});
