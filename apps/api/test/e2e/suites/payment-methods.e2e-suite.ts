import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  adminAccessToken,
  loginAs,
  request,
} from "../e2e-harness";

describe("Payment methods E2E", () => {
  it("supports admin catalog CRUD and ownership-scoped member accounts", async () => {
    assert.ok(adminAccessToken);
    const adminAuthorization = {
      Authorization: `Bearer ${adminAccessToken}`,
    };
    assert.equal((await request("/api/admin/payment-methods")).status, 401);
    assert.equal((await request("/api/member/payment-methods")).status, 401);
    const translations = [
      {
        locale: "vi",
        name: "Chuyển khoản ngân hàng",
        fields: [
          {
            key: "account_name",
            label: "Tên chủ tài khoản",
            type: "text",
            required: true,
          },
          {
            key: "account_number",
            label: "Số tài khoản",
            type: "text",
            required: true,
          },
        ],
      },
      {
        locale: "en",
        name: "Bank transfer",
        fields: [
          {
            key: "account_name",
            label: "Account holder",
            type: "text",
            required: true,
          },
          {
            key: "account_number",
            label: "Account number",
            type: "text",
            required: true,
          },
        ],
      },
    ];
    const createdResponse = await request("/api/admin/payment-methods", {
      method: "POST",
      headers: adminAuthorization,
      body: JSON.stringify({
        withdrawFee: "5.25",
        minWithdrawAmount: "100000",
        status: "published",
        translations,
      }),
    });
    assert.equal(
      createdResponse.status,
      201,
      await createdResponse.clone().text(),
    );
    const method = (await createdResponse.json()) as {
      id: number;
      withdrawFee: string;
      userMethodCount: number;
    };
    assert.equal(method.withdrawFee, "5.25");
    assert.equal(method.userMethodCount, 0);

    for (const [email, name] of [
      ["payment-owner@example.com", "Payment Owner"],
      ["payment-other@example.com", "Payment Other"],
    ]) {
      const registration = await request("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, name, password: "Secure123" }),
      });
      assert.equal(registration.status, 201);
    }
    const owner = await loginAs("payment-owner@example.com", "Secure123");
    const other = await loginAs("payment-other@example.com", "Secure123");
    const ownerAuthorization = {
      Authorization: `Bearer ${owner.body.accessToken}`,
    };
    const otherAuthorization = {
      Authorization: `Bearer ${other.body.accessToken}`,
    };

    const invalidAccount = await request("/api/member/payment-methods", {
      method: "POST",
      headers: ownerAuthorization,
      body: JSON.stringify({
        paymentMethodId: method.id,
        details: { account_name: "Test Owner" },
      }),
    });
    assert.equal(invalidAccount.status, 400);

    const accountResponse = await request("/api/member/payment-methods", {
      method: "POST",
      headers: ownerAuthorization,
      body: JSON.stringify({
        paymentMethodId: method.id,
        details: {
          account_name: "Test Owner",
          account_number: "123456789",
        },
      }),
    });
    assert.equal(
      accountResponse.status,
      201,
      await accountResponse.clone().text(),
    );
    const account = (await accountResponse.json()) as {
      id: number;
      details: Record<string, string>;
    };
    assert.equal(account.details.account_number, "123456789");

    const duplicateAccount = await request("/api/member/payment-methods", {
      method: "POST",
      headers: ownerAuthorization,
      body: JSON.stringify({
        paymentMethodId: method.id,
        details: {
          account_name: "Another Owner",
          account_number: "111111111",
        },
      }),
    });
    assert.equal(duplicateAccount.status, 409);

    const dashboard = await request("/api/member/payment-methods", {
      headers: ownerAuthorization,
    });
    assert.equal(dashboard.status, 200);
    const dashboardBody = (await dashboard.json()) as {
      catalog: unknown[];
      accounts: unknown[];
    };
    assert.equal(dashboardBody.catalog.length, 1);
    assert.equal(dashboardBody.accounts.length, 1);

    assert.equal(
      (
        await request(`/api/member/payment-methods/${account.id}`, {
          method: "PATCH",
          headers: otherAuthorization,
          body: JSON.stringify({
            details: {
              account_name: "Intruder",
              account_number: "0000",
            },
          }),
        })
      ).status,
      404,
    );
    assert.equal(
      (
        await request(`/api/member/payment-methods/${account.id}`, {
          method: "DELETE",
          headers: otherAuthorization,
        })
      ).status,
      404,
    );

    const incompatibleUpdate = await request(
      `/api/admin/payment-methods/${method.id}`,
      {
        method: "PATCH",
        headers: adminAuthorization,
        body: JSON.stringify({
          translations: translations.map((translation) => ({
            ...translation,
            fields: translation.fields.slice(0, 1),
          })),
        }),
      },
    );
    assert.equal(incompatibleUpdate.status, 409);
    assert.equal(
      (
        await request(`/api/admin/payment-methods/${method.id}`, {
          method: "DELETE",
          headers: adminAuthorization,
        })
      ).status,
      409,
    );

    assert.equal(
      (
        await request(`/api/member/payment-methods/${account.id}`, {
          method: "PATCH",
          headers: ownerAuthorization,
          body: JSON.stringify({
            details: {
              account_name: "Updated Owner",
              account_number: "987654321",
            },
          }),
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request(`/api/member/payment-methods/${account.id}`, {
          method: "DELETE",
          headers: ownerAuthorization,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request(`/api/admin/payment-methods/${method.id}`, {
          method: "DELETE",
          headers: adminAuthorization,
        })
      ).status,
      200,
    );
  });
});
