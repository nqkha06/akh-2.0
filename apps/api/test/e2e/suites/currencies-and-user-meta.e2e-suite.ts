import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  adminAccessToken,
  login,
  prisma,
  request,
} from "../e2e-harness";

describe("Currencies and user meta E2E", () => {
  it("manages USD-based rates and persists the member currency preference", async () => {
    assert.ok(adminAccessToken);
    const adminAuthorization = {
      Authorization: `Bearer ${adminAccessToken}`,
    };
    assert.equal(
      (await request("/api/admin/settings/currencies")).status,
      401,
    );

    const createdResponse = await request("/api/admin/settings/currencies", {
      method: "POST",
      headers: adminAuthorization,
      body: JSON.stringify({
        code: "VND",
        name: "Vietnamese đồng",
        symbol: "₫",
        exchangeRate: "22000",
        decimalDigits: 0,
        isDefault: false,
        isActive: true,
        sortOrder: 20,
      }),
    });
    assert.equal(
      createdResponse.status,
      201,
      await createdResponse.clone().text(),
    );
    const vnd = (await createdResponse.json()) as {
      id: number;
      exchangeRate: string;
    };
    assert.equal(vnd.exchangeRate, "22000");

    const memberSession = await login();
    const memberAuthorization = {
      Authorization: `Bearer ${memberSession.body.accessToken}`,
    };
    const preferenceResponse = await request(
      "/api/member/preferences/currency",
      {
        method: "PATCH",
        headers: memberAuthorization,
        body: JSON.stringify({ currency: "VND" }),
      },
    );
    assert.equal(
      preferenceResponse.status,
      200,
      await preferenceResponse.clone().text(),
    );
    assert.equal(
      ((await preferenceResponse.json()) as { currency: string }).currency,
      "VND",
    );
    const owner = await prisma.user.findUniqueOrThrow({
      where: { email: "auth@example.com" },
    });
    assert.equal(
      (
        await prisma.userMeta.findUniqueOrThrow({
          where: {
            userId_key: {
              userId: owner.id,
              key: "preferences.currency",
            },
          },
        })
      ).valueJson,
      JSON.stringify("VND"),
    );
    assert.equal(
      (
        await request(`/api/admin/settings/currencies/${vnd.id}`, {
          method: "DELETE",
          headers: adminAuthorization,
        })
      ).status,
      409,
    );

    const updateResponse = await request(
      `/api/admin/settings/currencies/${vnd.id}`,
      {
        method: "PATCH",
        headers: adminAuthorization,
        body: JSON.stringify({ exchangeRate: "22500.5" }),
      },
    );
    assert.equal(updateResponse.status, 200);
    assert.equal(
      ((await updateResponse.json()) as { exchangeRate: string })
        .exchangeRate,
      "22500.5",
    );

    const usd = await prisma.currency.findUniqueOrThrow({
      where: { code: "USD" },
    });
    assert.equal(
      (
        await request(`/api/admin/settings/currencies/${usd.id}`, {
          method: "DELETE",
          headers: adminAuthorization,
        })
      ).status,
      409,
    );

    await prisma.userMeta.deleteMany({
      where: {
        userId: owner.id,
        key: "preferences.currency",
      },
    });
    assert.equal(
      (
        await request(`/api/admin/settings/currencies/${vnd.id}`, {
          method: "DELETE",
          headers: adminAuthorization,
        })
      ).status,
      200,
    );
  });
});

