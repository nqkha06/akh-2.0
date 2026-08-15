import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  adminAccessToken,
  loginAs,
  prisma,
  request,
} from "../e2e-harness";

describe("Withdrawals E2E", () => {
  it("debits once, handles idempotency and refunds only cancelled or rejected requests", async () => {
    assert.ok(adminAccessToken);
    const adminAuthorization = {
      Authorization: `Bearer ${adminAccessToken}`,
    };
    const referrerRegistration = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "withdrawal-referrer@example.com",
        name: "Withdrawal Referrer",
        password: "Secure123",
      }),
    });
    assert.equal(referrerRegistration.status, 201);
    const referrer = await prisma.user.findUniqueOrThrow({
      where: { email: "withdrawal-referrer@example.com" },
    });
    assert.ok(referrer.referralCode);
    const referrerSession = await loginAs(
      "withdrawal-referrer@example.com",
      "Secure123",
    );
    const referrerAuthorization = {
      Authorization: `Bearer ${referrerSession.body.accessToken}`,
    };

    const registration = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "withdrawal-owner@example.com",
        name: "Withdrawal Owner",
        password: "Secure123",
        referralCode: referrer.referralCode,
      }),
    });
    assert.equal(registration.status, 201);
    const member = await loginAs(
      "withdrawal-owner@example.com",
      "Secure123",
    );
    const memberAuthorization = {
      Authorization: `Bearer ${member.body.accessToken}`,
    };
    const owner = await prisma.user.update({
      where: { email: "withdrawal-owner@example.com" },
      data: { balance: "1000000" },
    });
    const method = await prisma.paymentMethod.create({
      data: {
        withdrawFee: "10000",
        minWithdrawAmount: "100000",
        status: "published",
        translations: {
          create: {
            locale: "vi",
            name: "Ngân hàng kiểm thử",
            fieldsJson: "[]",
          },
        },
      },
    });
    const account = await prisma.userPaymentMethod.create({
      data: {
        userId: owner.id,
        paymentMethodId: method.id,
        detailsJson: JSON.stringify({
          account_name: "Withdrawal Owner",
          account_number: "123456789",
        }),
      },
    });

    const estimate = await request("/api/member/withdrawals/estimate", {
      method: "POST",
      headers: memberAuthorization,
      body: JSON.stringify({
        amount: "300000",
        userPaymentMethodId: account.id,
      }),
    });
    assert.equal(estimate.status, 201, await estimate.clone().text());
    assert.deepEqual(await estimate.json(), {
      requestedAmount: "300000",
      feeAmount: "10000",
      netAmount: "290000",
    });

    const firstPayload = {
      amount: "300000",
      userPaymentMethodId: account.id,
      idempotencyKey: "withdrawal-test-key-0001",
    };
    const firstResponse = await request("/api/member/withdrawals", {
      method: "POST",
      headers: memberAuthorization,
      body: JSON.stringify(firstPayload),
    });
    assert.equal(firstResponse.status, 201, await firstResponse.clone().text());
    const first = (await firstResponse.json()) as {
      id: number;
      currency: string;
      status: string;
      netAmount: string;
    };
    assert.equal(first.currency, "USD");
    assert.equal(first.status, "pending");
    assert.equal(first.netAmount, "290000");
    assert.equal(
      (
        await prisma.user.findUniqueOrThrow({ where: { id: owner.id } })
      ).balance.toString(),
      "700000",
    );

    const duplicate = await request("/api/member/withdrawals", {
      method: "POST",
      headers: memberAuthorization,
      body: JSON.stringify(firstPayload),
    });
    assert.equal(duplicate.status, 201);
    assert.equal(((await duplicate.json()) as { id: number }).id, first.id);
    assert.equal(
      (
        await prisma.user.findUniqueOrThrow({ where: { id: owner.id } })
      ).balance.toString(),
      "700000",
    );

    const createRequest = async (key: string, amount: string) => {
      const response = await request("/api/member/withdrawals", {
        method: "POST",
        headers: memberAuthorization,
        body: JSON.stringify({
          amount,
          userPaymentMethodId: account.id,
          idempotencyKey: key,
        }),
      });
      assert.equal(response.status, 201, await response.clone().text());
      return (await response.json()) as { id: number; status: string };
    };

    const paid = await createRequest("withdrawal-test-key-0002", "200000");
    assert.equal(
      (
        await request(`/api/admin/withdrawals/${paid.id}/process`, {
          method: "PATCH",
          headers: adminAuthorization,
        })
      ).status,
      200,
    );
    const paidResponse = await request(
      `/api/admin/withdrawals/${paid.id}/paid`,
      { method: "PATCH", headers: adminAuthorization },
    );
    assert.equal(paidResponse.status, 200);
    assert.equal(
      ((await paidResponse.json()) as { status: string }).status,
      "paid",
    );
    assert.equal(
      (
        await prisma.user.findUniqueOrThrow({ where: { id: referrer.id } })
      ).balance.toString(),
      "9500",
    );
    assert.equal(
      (
        await request(`/api/admin/withdrawals/${paid.id}/paid`, {
          method: "PATCH",
          headers: adminAuthorization,
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await prisma.user.findUniqueOrThrow({ where: { id: referrer.id } })
      ).balance.toString(),
      "9500",
    );

    const rejected = await createRequest(
      "withdrawal-test-key-0003",
      "100000",
    );
    const rejectResponse = await request(
      `/api/admin/withdrawals/${rejected.id}/reject`,
      {
        method: "PATCH",
        headers: adminAuthorization,
        body: JSON.stringify({ statusReason: "Thông tin nhận tiền không đúng." }),
      },
    );
    assert.equal(rejectResponse.status, 200);
    const rejectedBody = (await rejectResponse.json()) as {
      status: string;
      statusReason: string;
      processedBy: { id: number };
      processedAt: string;
    };
    assert.equal(rejectedBody.status, "rejected");
    assert.equal(
      rejectedBody.statusReason,
      "Thông tin nhận tiền không đúng.",
    );
    assert.ok(rejectedBody.processedBy.id);
    assert.ok(rejectedBody.processedAt);

    const cancelResponse = await request(
      `/api/member/withdrawals/${first.id}/cancel`,
      { method: "PATCH", headers: memberAuthorization },
    );
    assert.equal(cancelResponse.status, 200);
    assert.equal(
      ((await cancelResponse.json()) as { status: string }).status,
      "cancelled",
    );
    assert.equal(
      (
        await prisma.user.findUniqueOrThrow({ where: { id: owner.id } })
      ).balance.toString(),
      "800000",
    );
    assert.equal(
      (
        await request(`/api/member/withdrawals/${first.id}/cancel`, {
          method: "PATCH",
          headers: memberAuthorization,
        })
      ).status,
      409,
    );

    const secondPaid = await createRequest(
      "withdrawal-test-key-0004",
      "100000",
    );
    assert.equal(
      (
        await request(`/api/admin/withdrawals/${secondPaid.id}/process`, {
          method: "PATCH",
          headers: adminAuthorization,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request(`/api/admin/withdrawals/${secondPaid.id}/paid`, {
          method: "PATCH",
          headers: adminAuthorization,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await prisma.user.findUniqueOrThrow({ where: { id: referrer.id } })
      ).balance.toString(),
      "14000",
    );
    const commissions = await prisma.commission.findMany({
      where: { userId: referrer.id },
      orderBy: { amount: "asc" },
    });
    assert.equal(commissions.length, 2);
    assert.deepEqual(
      commissions.map((commission) => [
        commission.amount.toString(),
        commission.rate.toString(),
        commission.commissionableType,
      ]),
      [
        ["4500", "5", "user_withdrawal"],
        ["9500", "5", "user_withdrawal"],
      ],
    );

    const dashboardResponse = await request(
      "/api/member/withdrawals/dashboard",
      { headers: memberAuthorization },
    );
    assert.equal(dashboardResponse.status, 200);
    const dashboard = (await dashboardResponse.json()) as {
      currency: string;
      availableBalance: string;
      pendingBalance: string;
      totalReceived: string;
      withdrawals: unknown[];
    };
    assert.equal(dashboard.currency, "USD");
    assert.equal(dashboard.availableBalance, "700000");
    assert.equal(dashboard.pendingBalance, "0");
    assert.equal(dashboard.totalReceived, "280000");
    assert.equal(dashboard.withdrawals.length, 4);

    const referralsDashboardResponse = await request(
      "/api/member/referrals/dashboard",
      { headers: referrerAuthorization },
    );
    assert.equal(
      referralsDashboardResponse.status,
      200,
      await referralsDashboardResponse.clone().text(),
    );
    const referralsDashboard = (await referralsDashboardResponse.json()) as {
      currency: string;
      commissionRate: string;
      summary: {
        totalReferrals: number;
        totalCommission: string;
        successfulWithdrawals: number;
      };
      referrals: Array<{
        id: number;
        successfulWithdrawals: number;
        totalCommission: string;
      }>;
      recentCommissions: Array<{
        amount: string;
        withdrawalId: number;
      }>;
    };
    assert.equal(referralsDashboard.currency, "USD");
    assert.equal(referralsDashboard.commissionRate, "5.00");
    assert.deepEqual(referralsDashboard.summary, {
      totalReferrals: 1,
      totalCommission: "14000",
      successfulWithdrawals: 2,
    });
    assert.equal(referralsDashboard.referrals[0]?.id, owner.id);
    assert.equal(
      referralsDashboard.referrals[0]?.successfulWithdrawals,
      2,
    );
    assert.equal(referralsDashboard.referrals[0]?.totalCommission, "14000");
    assert.deepEqual(
      new Set(
        referralsDashboard.recentCommissions.map(
          (commission) => commission.withdrawalId,
        ),
      ),
      new Set([paid.id, secondPaid.id]),
    );

    const adminListResponse = await request(
      "/api/admin/withdrawals?status=paid,rejected&search=Withdrawal%20Owner&sortBy=amount&sortOrder=asc&page=1&perPage=10",
      { headers: adminAuthorization },
    );
    assert.equal(
      adminListResponse.status,
      200,
      await adminListResponse.clone().text(),
    );
    const adminList = (await adminListResponse.json()) as {
      items: Array<{ amount: string; currency: string; status: string }>;
      total: number;
      pageCount: number;
    };
    assert.equal(adminList.total, 3);
    assert.equal(adminList.pageCount, 1);
    assert.ok(adminList.items.every((item) => item.currency === "USD"));
    assert.deepEqual(
      adminList.items
        .map((item) => [item.amount, item.status])
        .sort(([leftAmount, leftStatus], [rightAmount, rightStatus]) =>
          `${leftAmount}:${leftStatus}`.localeCompare(
            `${rightAmount}:${rightStatus}`,
          ),
        ),
      [
        ["100000", "paid"],
        ["100000", "rejected"],
        ["200000", "paid"],
      ].sort(([leftAmount, leftStatus], [rightAmount, rightStatus]) =>
        `${leftAmount}:${leftStatus}`.localeCompare(
          `${rightAmount}:${rightStatus}`,
        ),
      ),
    );

    await prisma.userWithdrawal.deleteMany({ where: { userId: owner.id } });
    await prisma.userPaymentMethod.delete({ where: { id: account.id } });
    await prisma.paymentMethod.delete({ where: { id: method.id } });
    await prisma.user.delete({ where: { id: owner.id } });
    await prisma.user.delete({ where: { id: referrer.id } });
  });
});

